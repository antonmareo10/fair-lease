/** Aggregates the per-run scores into the numbers and the markdown table in eval/README.md. */
import { summarizeRun, type RunScore } from "./score";
import { CONFIGS, scoreRun, type Contract, type Run } from "./pipeline";
import type { Gold } from "./score";

export type Stat = { mean: number; min: number; max: number; values: number[] };

export const stat = (values: number[]): Stat => ({
  mean: values.reduce((a, b) => a + b, 0) / (values.length || 1),
  min: Math.min(...values),
  max: Math.max(...values),
  values,
});

export type ConfigSummary = {
  id: string;
  label: string;
  model: string;
  runs: number;
  failedCalls: number;
  servedBy: string[];
  costUsd: number;
  costPerContractUsd: number;
  perRun: RunScore[];
  metrics: Record<string, Stat>;
  perContractVerdictCorrect: Record<string, Stat>;
  quotesProposed: Stat | null;
  quotesDropped: Stat | null;
};

const METRICS: Record<string, (s: RunScore) => number> = {
  verdictCorrect: (s) => s.verdictCorrect,
  illegalFound: (s) => s.illegalFound,
  checkFound: (s) => s.checkFound,
  okKept: (s) => s.okKept,
  falseAlarms: (s) => s.falseAlarms,
  softAlarms: (s) => s.softAlarms,
  extraFlags: (s) => s.extraFlags,
  flaggedRight: (s) => s.flaggedRight,
  flaggedRightWithArticle: (s) => s.flaggedRightWithArticle,
  citations: (s) => s.citations,
  citationsInvented: (s) => s.citationsInvented,
  citationsWrong: (s) => s.citationsWrong,
  entries: (s) => s.entries,
  quotesNotInText: (s) => s.quotesNotInText,
  lawVersionCorrect: (s) => s.lawVersionCorrect,
  eurosCorrect: (s) => s.eurosCorrect,
  euroSpurious: (s) => s.euroSpurious,
};

/** Keep only some contracts and run numbers (to compare a partial configuration on exactly what it covers). */
export function restrict(gold: Gold, runs: Run[], contractIds: string[], runNumbers: number[]): { gold: Gold; runs: Run[] } {
  return {
    gold: { ...gold, contracts: Object.fromEntries(Object.entries(gold.contracts).filter(([id]) => contractIds.includes(id))) },
    runs: runs.filter((r) => contractIds.includes(r.contract) && runNumbers.includes(r.run)),
  };
}

export function summarize(runs: Run[], gold: Gold, contracts: Record<string, Contract>): ConfigSummary[] {
  const out: ConfigSummary[] = [];
  for (const config of CONFIGS) {
    const mine = runs.filter((r) => r.config === config.id);
    if (mine.length === 0) continue;
    const runNumbers = [...new Set(mine.map((r) => r.run))].sort((a, b) => a - b);
    const perRun: RunScore[] = [];
    const perContract: Record<string, number[]> = {};
    const proposed: number[] = [];
    const dropped: number[] = [];
    let failedCalls = 0;
    for (const n of runNumbers) {
      const details = Object.keys(gold.contracts).map((id) => {
        const run = mine.find((r) => r.run === n && r.contract === id);
        if (!run) return null;
        return { id, detail: scoreRun(run, gold, contracts[id]) };
      });
      const present = details.filter((d): d is NonNullable<typeof d> => d !== null);
      failedCalls += present.filter((d) => d.detail.failed).length;
      perRun.push(summarizeRun(present.map((d) => d.detail.score)));
      for (const d of present) (perContract[d.id] ??= []).push(d.detail.score.units.filter((u) => u.correct).length);
      const p = present.map((d) => d.detail.quotesProposed).filter((x): x is number => x !== undefined);
      const q = present.map((d) => d.detail.quotesDropped).filter((x): x is number => x !== undefined);
      if (p.length) proposed.push(p.reduce((a, b) => a + b, 0));
      if (q.length) dropped.push(q.reduce((a, b) => a + b, 0));
    }
    const cost = mine.reduce((a, r) => a + r.costUsd, 0);
    out.push({
      id: config.id,
      label: config.label,
      model: config.model,
      runs: runNumbers.length,
      failedCalls,
      servedBy: [...new Set(mine.map((r) => r.servedBy ?? "unknown"))],
      costUsd: cost,
      costPerContractUsd: cost / mine.length,
      perRun,
      metrics: Object.fromEntries(Object.entries(METRICS).map(([k, f]) => [k, stat(perRun.map(f))])),
      perContractVerdictCorrect: Object.fromEntries(Object.entries(perContract).map(([k, v]) => [k, stat(v)])),
      quotesProposed: proposed.length ? stat(proposed) : null,
      quotesDropped: dropped.length ? stat(dropped) : null,
    });
  }
  return out;
}

const fmt = (s: Stat, digits = 1) => (s.min === s.max ? String(Number(s.mean.toFixed(digits))) : `${s.mean.toFixed(digits)} (${s.min}-${s.max})`);

/** The markdown table that goes into eval/README.md and the main README. Totals come from the gold, not from a run. */
export function renderTable(configs: ConfigSummary[], gold: Gold): string {
  const units = Object.values(gold.contracts).flatMap((c) => c.units);
  const nIllegal = units.filter((u) => u.verdict === "ILLEGAL").length;
  const nCheck = units.filter((u) => u.verdict === "CHECK").length;
  const nOk = units.filter((u) => u.verdict === "OK").length;
  const nContracts = Object.keys(gold.contracts).length;
  const nEuros = units.filter((u) => u.overEur !== undefined).length + Object.values(gold.contracts).filter((c) => c.totalOverEur > 0).length;
  const header = ["", ...configs.map((c) => c.label)];
  const row = (label: string, f: (c: ConfigSummary) => string) => [label, ...configs.map(f)];
  const rows = [
    row(`Verdict matches GOLD (of ${units.length} rows)`, (c) => fmt(c.metrics.verdictCorrect)),
    row(`Not-enforceable clauses found (of ${nIllegal})`, (c) => fmt(c.metrics.illegalFound)),
    row(`"Worth checking" clauses found (of ${nCheck})`, (c) => fmt(c.metrics.checkFound)),
    row(`Problem clauses flagged at all, any severity (of ${nIllegal + nCheck})`, (c) => fmt(c.metrics.flaggedRight)),
    row(`Fine clauses left alone (of ${nOk})`, (c) => fmt(c.metrics.okKept)),
    row("Fine clauses wrongly called not enforceable", (c) => fmt(c.metrics.falseAlarms)),
    row("Fine clauses sent to review", (c) => fmt(c.metrics.softAlarms)),
    row("Flags on passages GOLD does not label", (c) => fmt(c.metrics.extraFlags)),
    row("Right flags that cite an accepted article", (c) => `${fmt(c.metrics.flaggedRightWithArticle)} of ${fmt(c.metrics.flaggedRight)}`),
    row("LAU articles cited / not in the LAU / real but wrong for that clause", (c) => `${fmt(c.metrics.citations)} / ${fmt(c.metrics.citationsInvented)} / ${fmt(c.metrics.citationsWrong)}`),
    row("Quotes shown that are not literally in the contract", (c) => `${fmt(c.metrics.quotesNotInText)} of ${fmt(c.metrics.entries)}`),
    row(`Right version of the law (of ${nContracts} contracts)`, (c) => fmt(c.metrics.lawVersionCorrect)),
    row(`Euro figures right (of ${nEuros})`, (c) => fmt(c.metrics.eurosCorrect)),
    row("Euros claimed on a fine clause", (c) => fmt(c.metrics.euroSpurious)),
    row("Cost per contract", (c) => `$${c.costPerContractUsd.toFixed(3)}`),
  ];
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}

export function renderPerContract(configs: ConfigSummary[], gold: Gold): string {
  const ids = Object.keys(gold.contracts);
  const header = ["Rows matching GOLD", ...configs.map((c) => c.label)];
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  const rows = ids.map((id) => [`${gold.contracts[id].title} (of ${gold.contracts[id].units.length})`, ...configs.map((c) => fmt(c.perContractVerdictCorrect[id]))]);
  return [line(header), line(header.map(() => "---")), ...rows.map(line)].join("\n");
}
