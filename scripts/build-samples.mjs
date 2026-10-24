// Builds samples/<id>.json from a contract text file and a hand-made extraction
// fixture (scripts/fixtures/<id>.extraction.json). Recorded extractions from
// Claude are written by scripts/record-samples.ts instead and are never overwritten here.
//
// Usage: node scripts/build-samples.mjs <path-to-demo_contracts-folder>
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SAMPLES = [
  { id: "traps-2025", title: "A contract full of traps (2025)", file: "01_trampas_2025.txt" },
  { id: "fair-2024", title: "A fair contract (2024)", file: "02_limpio_2024.txt" },
  { id: "reform-oct-2026", title: "Signed after the Oct 2026 reform", file: "03_nueva_ley_oct2026.txt" },
];

const src = process.argv[2];
if (!src) {
  console.error("Pass the folder with the demo contract .txt files.");
  process.exit(1);
}
mkdirSync("samples", { recursive: true });

for (const s of SAMPLES) {
  const fixture = join("scripts", "fixtures", `${s.id}.extraction.json`);
  const out = join("samples", `${s.id}.json`);
  if (!existsSync(fixture)) {
    console.log(`skip ${s.id}: no fixture yet`);
    continue;
  }
  if (existsSync(out) && JSON.parse(readFileSync(out, "utf8")).provenance?.kind === "recorded") {
    console.log(`keep ${s.id}: recorded extraction already present`);
    continue;
  }
  const text = readFileSync(join(src, s.file), "utf8").replace(/\r\n/g, "\n").trimEnd() + "\n";
  const extraction = JSON.parse(readFileSync(fixture, "utf8"));
  const sample = { id: s.id, title: s.title, text, extraction, provenance: { kind: "hand-made" } };
  writeFileSync(out, JSON.stringify(sample, null, 2) + "\n");
  console.log(`wrote ${out}`);
}
