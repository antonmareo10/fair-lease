/**
 * Fair Lease vs the model alone, on the GOLD clauses of the three sample contracts (eval/README.md).
 *
 *   npm run eval                      → run every missing call (3 runs per configuration), then score
 *   npm run eval -- --score-only      → recompute scores from eval/results/runs.json, no API calls
 *   npm run eval -- --fresh           → ignore stored runs and call again
 *   npm run eval -- --configs alone-sonnet --runs 3 --cap 0.9
 *
 *   npm run eval -- --set holdout     → the six held-out contracts (eval/holdout/gold.json), written to
 *                                       eval/results-holdout/; Fair Lease and Sonnet alone only, cap $1.60
 *   npm run eval -- --set holdout --out eval/results-holdout-v2 → same, stored in another folder
 *
 * Needs ANTHROPIC_API_KEY in .env.local for the calls. A hard spend cap (default $0.95, $1.60 for the
 * held-out set) stops new calls; it counts what the runs already stored in the output folder cost.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { callClaude } from "@/lib/claude";
import { runExtraction, type ModelCall } from "@/lib/extract";
import { createLimiter } from "@/lib/limit";
import { costOf } from "./compare";
import { callModelAlone } from "./eval/model-alone";
import { CONFIGS, EVAL_TODAY, loadContract, loadGold, scoreRun, type Contract, type EvalSet, type Run } from "./eval/pipeline";
import { renderPerContract, renderTable, restrict, summarize, type ReportOptions } from "./eval/report";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SET = value("set", "samples") as EvalSet;
if (SET !== "samples" && SET !== "holdout") {
  console.error(`Unknown --set ${SET}. Use samples or holdout.`);
  process.exit(1);
}
const HOLDOUT = SET === "holdout";
const RUNS = Number(value("runs", "3"));
const CAP = Number(value("cap", HOLDOUT ? "1.6" : "0.95"));
// The held-out set compares Fair Lease with Sonnet alone; Opus alone did not fit the budget.
const ONLY = value("configs", HOLDOUT ? "fair-lease-sonnet,alone-sonnet" : "").split(",").filter(Boolean);
const ONLY_CONTRACTS = value("contracts", "").split(",").filter(Boolean);
const POOL = Number(value("parallel", "4"));
const RESULTS = value("out", HOLDOUT ? "eval/results-holdout" : "eval/results");
const RUNS_FILE = `${RESULTS}/runs.json`;
const REPORT: ReportOptions = { otherRuleRow: HOLDOUT };

const gold = loadGold(".", SET);
const contracts: Record<string, Contract> = Object.fromEntries(Object.keys(gold.contracts).map((id) => [id, loadContract(gold, id)]));
const stored: Run[] = existsSync(RUNS_FILE) && !flag("fresh") ? (JSON.parse(readFileSync(RUNS_FILE, "utf8")).runs as Run[]) : [];
const keyOf = (r: Pick<Run, "config" | "contract" | "run">) => `${r.config}|${r.contract}|${r.run}`;
const done = new Map(stored.map((r) => [keyOf(r), r]));
let spent = stored.reduce((a, r) => a + r.costUsd, 0);

mkdirSync(RESULTS, { recursive: true });
const save = () => writeFileSync(RUNS_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), today: EVAL_TODAY, runs: [...done.values()] }, null, 1) + "\n");

async function execute(config: (typeof CONFIGS)[number], contract: Contract, run: number): Promise<Run> {
  const t0 = Date.now();
  const base = { config: config.id, contract: contract.id, run, model: config.model };
  try {
    if (config.kind === "fair-lease") {
      // The real route code (lib/extract.ts + lib/claude.ts); a wrapper only counts the tokens of every attempt.
      let tokens = { input_tokens: 0, output_tokens: 0 };
      let servedBy: string | null = null;
      let stopReason: string | null = null;
      const call: ModelCall = async (text, model) => {
        const reply = await callClaude(text, model);
        tokens = { input_tokens: tokens.input_tokens + (reply.usage?.input_tokens ?? 0), output_tokens: tokens.output_tokens + (reply.usage?.output_tokens ?? 0) };
        servedBy = reply.model;
        stopReason = reply.stopReason;
        return reply;
      };
      const r = await runExtraction(
        { text: contract.text },
        { call, model: config.model, limiter: createLimiter({ daily: 10_000, perIpPerHour: 10_000 }), ip: "eval", hasKey: true },
      );
      return {
        ...base,
        servedBy,
        stopReason,
        usage: tokens,
        costUsd: costOf(servedBy ?? config.model, tokens),
        ms: Date.now() - t0,
        extraction: r.ok ? r.extraction : null,
        ...(r.ok ? {} : { error: r.error }),
      };
    }
    const reply = await callModelAlone(contract.text, contract.signedLong, config.model, config.effort);
    return { ...base, servedBy: reply.model, stopReason: reply.stopReason, usage: reply.usage, costUsd: costOf(reply.model, reply.usage), ms: Date.now() - t0, output: reply.output };
  } catch (e) {
    return { ...base, servedBy: null, stopReason: null, usage: { input_tokens: 0, output_tokens: 0 }, costUsd: 0, ms: Date.now() - t0, error: e instanceof Error ? e.message.slice(0, 200) : "unknown" };
  }
}

if (!flag("score-only")) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is missing from .env.local. Nothing was sent. Use --score-only to rescore stored runs.");
    process.exit(1);
  }
  const todo: { config: (typeof CONFIGS)[number]; contract: Contract; run: number }[] = [];
  // Configuration by configuration, so that a spending cap cuts the last (and most expensive) one, not the others.
  for (const config of CONFIGS.filter((c) => ONLY.length === 0 || ONLY.includes(c.id)))
    for (const run of Array.from({ length: RUNS }, (_, i) => i + 1))
      for (const contract of Object.values(contracts).filter((c) => ONLY_CONTRACTS.length === 0 || ONLY_CONTRACTS.includes(c.id))) if (!done.has(keyOf({ config: config.id, contract: contract.id, run }))) todo.push({ config, contract, run });

  console.log(`${todo.length} calls to make, ${done.size} stored, spent so far $${spent.toFixed(3)}, cap $${CAP.toFixed(2)}`);
  let next = 0;
  let skipped = 0;
  let inflight = 0;
  const worker = async () => {
    while (next < todo.length) {
      const job = todo[next++];
      // Reserve a worst-case price for the call in flight (an Opus call costs about twice a Sonnet one).
      const reserve = job.config.model.includes("opus") ? 0.1 : 0.06;
      // Calls in flight hold their reserve; wait for them to settle before deciding to skip.
      while (spent + reserve > CAP && inflight > 0) await new Promise((resolve) => setTimeout(resolve, 250));
      if (spent + reserve > CAP) {
        skipped += 1;
        continue;
      }
      spent += reserve;
      inflight += 1;
      const r = await execute(job.config, job.contract, job.run);
      inflight -= 1;
      spent += r.costUsd - reserve;
      if (r.error && !r.extraction && !r.output) console.error(`  ${keyOf(r)} failed: ${r.error}`);
      else {
        done.set(keyOf(r), r);
        save();
      }
      console.log(`  ${keyOf(r)} · ${(r.ms / 1000).toFixed(1)} s · in ${r.usage.input_tokens} / out ${r.usage.output_tokens} · $${r.costUsd.toFixed(3)} · total $${spent.toFixed(3)}`);
    }
  };
  await Promise.all(Array.from({ length: POOL }, worker));
  if (skipped) console.warn(`${skipped} calls skipped to stay under the $${CAP.toFixed(2)} cap`);
}

// ---- score (offline) ----
const runs = [...done.values()];
if (runs.length === 0) {
  console.log(`No stored runs in ${RUNS_FILE}: nothing to score.`);
  process.exit(0);
}
const contractIds = Object.keys(gold.contracts);
const summary = summarize(runs, gold, contracts, REPORT);

// A configuration is complete when it has every run of every contract; partial ones (budget) are compared on what they cover.
const nRuns = Math.max(...runs.map((r) => r.run));
const isComplete = (id: string) => runs.filter((r) => r.config === id).length === contractIds.length * nRuns;
const complete = summary.filter((c) => isComplete(c.id));
const partial = summary.filter((c) => !isComplete(c.id));

let markdown = `${renderTable(complete, gold, REPORT)}

${renderPerContract(complete, gold)}
`;
for (const p of partial) {
  const mine = runs.filter((r) => r.config === p.id);
  const ids = contractIds.filter((id) => mine.some((r) => r.contract === id));
  const nums = [...new Set(mine.map((r) => r.run))];
  const sub = restrict(gold, runs, ids, nums);
  const subSummary = summarize(sub.runs, sub.gold, contracts, REPORT).filter((c) => c.id === p.id || isComplete(c.id));
  markdown += `\n${p.label}: ${nums.length} run on ${ids.join(" + ")} (budget), compared with the other configurations on the same contracts, ${nums.length === 1 ? `run ${nums[0]}` : `runs ${nums.join(", ")}`} only.\n\n${renderTable(subSummary, sub.gold, REPORT)}\n`;
}

// Per-row matrix: what each configuration said about each GOLD row, run by run.
const matrix: Record<string, { gold: string; rule: string; byConfig: Record<string, string[]> }> = {};
for (const run of runs.sort((a, b) => a.run - b.run)) {
  for (const u of scoreRun(run, gold, contracts[run.contract]).score.units) {
    const row = (matrix[u.id] ??= { gold: u.gold, rule: u.rule, byConfig: {} });
    (row.byConfig[run.config] ??= []).push(u.matched ? `${u.got}${u.articleStatus === "wrong" ? " (wrong article)" : ""}` : "not mentioned");
  }
}

const total = runs.reduce((a, r) => a + r.costUsd, 0);
writeFileSync(`${RESULTS}/summary.json`, JSON.stringify({ ...(HOLDOUT ? { set: SET } : {}), today: EVAL_TODAY, totalCostUsd: total, configs: summary }, null, 1) + "\n");
writeFileSync(`${RESULTS}/rows.json`, JSON.stringify(matrix, null, 1) + "\n");
writeFileSync(`${RESULTS}/table.md`, markdown);
console.log(`\n${markdown}\nTotal spent: $${total.toFixed(3)} over ${runs.length} calls`);
