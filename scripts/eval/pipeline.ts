/**
 * Glue between the stored raw runs and the scoring: loads GOLD and the contract texts, and turns a stored
 * run (Fair Lease extraction or model-alone answer) into a ContractScore. Pure and offline.
 */
import { readFileSync } from "node:fs";
import { anonymize } from "@/lib/anonymize";
import { analyze } from "@/lib/analyze";
import { extractionSchema, type Extraction, type SampleFile } from "@/lib/extraction";
import {
  entriesFromFairLease,
  entriesFromModel,
  fairLeaseLawFrom,
  fairLeaseTotalEur,
  scoreContract,
  type ContractScore,
  type Gold,
  type ModelAloneOutput,
} from "./score";

/** The date the evaluation pretends to run on, so the DF 6ª window and the like never depend on the clock. */
export const EVAL_TODAY = "2026-10-24";

export type Usage = { input_tokens: number; output_tokens: number };

export type Run = {
  config: string;
  contract: string;
  run: number;
  model: string;
  servedBy: string | null;
  stopReason: string | null;
  usage: Usage;
  costUsd: number;
  ms: number;
  /** Fair Lease: the structured extraction returned by the model (the rules run on it offline). */
  extraction?: Extraction | null;
  /** Model alone: the parsed answer. */
  output?: ModelAloneOutput | null;
  error?: string;
};

export type ConfigDef =
  | { id: string; label: string; kind: "fair-lease"; model: string }
  | { id: string; label: string; kind: "alone"; model: string; effort: "low" | "medium" | "high" };

export const CONFIGS: ConfigDef[] = [
  { id: "fair-lease-sonnet", label: "Fair Lease (Sonnet 5.5 + rules + quote check)", kind: "fair-lease", model: "claude-sonnet-5-5" },
  { id: "alone-sonnet", label: "Sonnet 5.5 alone", kind: "alone", model: "claude-sonnet-5-5", effort: "low" },
  { id: "alone-opus", label: "Opus 5.5 alone", kind: "alone", model: "claude-opus-5-5", effort: "low" },
];

export type Contract = {
  id: string;
  text: string;
  signedLong: string;
  fixtureQuotes: { clause_ref: string; quote: string }[];
};

export function loadGold(root = "."): Gold {
  return JSON.parse(readFileSync(`${root}/eval/gold.json`, "utf8")) as Gold;
}

/** The contract exactly as the app sends it (personal data removed in the browser first). */
export function loadContract(gold: Gold, id: string, root = "."): Contract {
  const sample = JSON.parse(readFileSync(`${root}/samples/${gold.contracts[id].sample}.json`, "utf8")) as SampleFile;
  const fixture = JSON.parse(readFileSync(`${root}/scripts/fixtures/${gold.contracts[id].sample}.extraction.json`, "utf8")) as Extraction;
  return {
    id,
    text: anonymize(sample.text).text,
    signedLong: gold.contracts[id].signedLong,
    fixtureQuotes: fixture.clauses.map((c) => ({ clause_ref: c.clause_ref, quote: c.quote })),
  };
}

export type RunDetail = { score: ContractScore; quotesProposed?: number; quotesDropped?: number; failed: boolean };

export function scoreRun(run: Run, gold: Gold, contract: Contract): RunDetail {
  const g = gold.contracts[run.contract];
  const base = { gold: g, text: contract.text, fixtureQuotes: contract.fixtureQuotes };
  const config = CONFIGS.find((c) => c.id === run.config);
  if (config?.kind === "fair-lease") {
    const extraction = run.extraction ? extractionSchema.safeParse(run.extraction) : null;
    if (!extraction?.success) return { score: scoreContract({ ...base, entries: [], lawVersionFrom: null, totalEur: null, byRule: true }), failed: true };
    const result = analyze(contract.text, extraction.data, { today: EVAL_TODAY });
    return {
      score: scoreContract({
        ...base,
        entries: entriesFromFairLease(result),
        lawVersionFrom: fairLeaseLawFrom(result),
        totalEur: fairLeaseTotalEur(result),
        byRule: true,
      }),
      quotesProposed: extraction.data.clauses.length,
      quotesDropped: result.hiddenCount,
      failed: false,
    };
  }
  if (!run.output) return { score: scoreContract({ ...base, entries: [], lawVersionFrom: null, totalEur: null, byRule: false }), failed: true };
  return {
    score: scoreContract({
      ...base,
      entries: entriesFromModel(run.output),
      lawVersionFrom: /^\d{4}-\d{2}-\d{2}$/.test(run.output.law_version_in_force_from) ? run.output.law_version_in_force_from : null,
      totalEur: run.output.total_euros_over_limit_at_signing,
      byRule: false,
    }),
    failed: false,
  };
}
