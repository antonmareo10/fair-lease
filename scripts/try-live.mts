/**
 * One live check through the same code the route uses (lib/extract.ts + lib/claude.ts),
 * compared with the hand-made expected result. Usage: npm run try-live -- traps-2025
 */
import { readFileSync } from "node:fs";
import { callClaude } from "@/lib/claude";
import { runExtraction } from "@/lib/extract";
import { createLimiter } from "@/lib/limit";
import { anonymize } from "@/lib/anonymize";
import { analyze } from "@/lib/analyze";
import type { SampleFile } from "@/lib/extraction";
import { costOf, rows } from "./compare";

const id = process.argv[2] ?? "traps-2025";
const model = process.env.FL_LIVE_MODEL || "claude-sonnet-5-5";
const sample = JSON.parse(readFileSync(`samples/${id}.json`, "utf8")) as SampleFile;
const hand = JSON.parse(readFileSync(`scripts/fixtures/${id}.extraction.json`, "utf8"));
const text = anonymize(sample.text).text;
const t0 = Date.now();
const r = await runExtraction({ text }, { call: callClaude, model, limiter: createLimiter({ daily: 5 }), ip: "script", hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
if (!r.ok) {
  console.error(`live check failed: ${r.error}`);
  process.exit(1);
}
const got = analyze(text, r.extraction, { today: "2026-10-24" });
const want = analyze(text, hand, { today: "2026-10-24" });
const a = rows(got, r.extraction), b = rows(want, hand);
console.log(`${id} via ${r.model} · ${((Date.now() - t0) / 1000).toFixed(1)} s · in ${r.usage?.input_tokens} / out ${r.usage?.output_tokens} · $${costOf(r.model, r.usage).toFixed(3)}`);
console.log(`hidden quotes: ${got.hiddenCount} · counts ${JSON.stringify(got.counts)} (expected ${JSON.stringify(want.counts)})`);
console.log(`missing: ${b.filter((x) => !a.includes(x)).join(" | ") || "none"}`);
console.log(`extra:   ${a.filter((x) => !b.includes(x)).join(" | ") || "none"}`);
const sameNonOk = (xs: string[]) => xs.filter((x) => !x.endsWith(" OK"));
console.log(sameNonOk(a).join() === sameNonOk(b).join() ? "RESULT: same not-enforceable / worth-checking verdicts as expected" : "RESULT: verdicts differ");
