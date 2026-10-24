import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import { buildLetter } from "@/lib/letter";
import type { SampleFile } from "@/lib/extraction";
import traps from "@/samples/traps-2025.json";
import fair from "@/samples/fair-2024.json";
import reform from "@/samples/reform-oct-2026.json";

const run = (s: unknown) => {
  const sample = s as SampleFile;
  const r = analyze(sample.text, sample.extraction, { today: "2026-10-24" });
  return { r, sample };
};

describe("Landlord Message Builder", () => {
  it("lists all 10 not-enforceable findings of the traps sample, each with its law", () => {
    const { r, sample } = run(traps);
    const es = buildLetter(r.findings, sample.extraction.clauses, "es")!;
    const items = es.split("\n").filter((l) => /^\d+\. /.test(l));
    expect(items).toHaveLength(10);
    for (const line of items) expect(line).toMatch(/art[íi]culo|art\. /);
    expect(es).toContain("Cláusula décima: ¿Podemos cambiarlo por visitas con cita previa acordada conmigo? (art. 18.2 de la Constitución)");
    expect(es.startsWith("Hola:")).toBe(true);
    const en = buildLetter(r.findings, sample.extraction.clauses, "en")!;
    expect(en).toContain("Clause segunda: This clause conflicts with article 9.1 LAU");
  });

  it("writes nothing for the fair contract", () => {
    const { r, sample } = run(fair);
    expect(buildLetter(r.findings, sample.extraction.clauses, "es")).toBeNull();
  });

  it("names every clause a multi-clause finding rests on", () => {
    const { r, sample } = run(reform);
    const es = buildLetter(r.findings, sample.extraction.clauses, "es")!;
    expect(es).toContain("Título y Cláusulas primera, segunda, décima:");
  });
});
