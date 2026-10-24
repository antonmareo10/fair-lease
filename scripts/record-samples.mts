/**
 * Record the samples' extractions with Claude (spec.md > Samples, checklist slice 6).
 * Sends each sample contract, anonymised exactly as the app does, through the same
 * request the live route uses, then compares the verdicts with the hand-made fixture.
 *
 *   npm run record-samples            → dry run: writes test-results/recorded-<id>.json
 *   npm run record-samples -- --write → replaces samples/<id>.json (provenance: recorded)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { callClaude } from "@/lib/claude";
import { anonymize } from "@/lib/anonymize";
import { analyze } from "@/lib/analyze";
import { extractionSchema, type SampleFile } from "@/lib/extraction";
import { PRICES, costOf, rows } from "./compare";

const IDS = ["traps-2025", "fair-2024", "reform-oct-2026"];
const MODEL = process.env.FL_RECORD_MODEL || "claude-opus-5-5";
const write = process.argv.includes("--write");
const only = process.argv.find((a) => IDS.includes(a));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is missing from .env.local. Nothing was sent.");
  process.exit(1);
}

let total = 0;
for (const id of only ? [only] : IDS) {
  const sample = JSON.parse(readFileSync(`samples/${id}.json`, "utf8")) as SampleFile;
  const hand = JSON.parse(readFileSync(`scripts/fixtures/${id}.extraction.json`, "utf8"));
  const text = anonymize(sample.text).text;
  const t0 = Date.now();
  const reply = await callClaude(text, MODEL);
  const parsed = extractionSchema.safeParse(reply.output);
  if (reply.stopReason !== "end_turn" || !parsed.success) {
    console.error(`${id}: stop=${reply.stopReason} valid=${parsed.success}`, parsed.success ? "" : parsed.error.issues.slice(0, 5));
    process.exitCode = 1;
    continue;
  }
  const cost = costOf(reply.model, reply.usage);
  total += cost;
  const got = analyze(text, parsed.data, { today: "2026-10-24" });
  const want = analyze(text, hand, { today: "2026-10-24" });
  const a = rows(got, parsed.data), b = rows(want, hand);
  console.log(`\n${id}: ${reply.model} · ${((Date.now() - t0) / 1000).toFixed(1)} s · in ${reply.usage?.input_tokens} / out ${reply.usage?.output_tokens} tokens · $${cost.toFixed(3)}`);
  console.log(`  hidden quotes: ${got.hiddenCount} · counts ${JSON.stringify(got.counts)} (hand-made ${JSON.stringify(want.counts)})`);
  console.log(`  missing vs hand-made: ${b.filter((r) => !a.includes(r)).join(" | ") || "none"}`);
  console.log(`  extra vs hand-made:   ${a.filter((r) => !b.includes(r)).join(" | ") || "none"}`);
  const out = { ...sample, extraction: parsed.data, provenance: { kind: "recorded", model: reply.model, recordedAt: new Date().toISOString() } };
  const path = write ? `samples/${id}.json` : `test-results/recorded-${id}.json`;
  mkdirSync("test-results", { recursive: true });
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  console.log(`  wrote ${path}`);
}
console.log(`\nTotal ≈ $${total.toFixed(3)} (prices per MTok: ${JSON.stringify(PRICES)})`);
