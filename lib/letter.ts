import type { Clause } from "@/lib/extraction";
import type { Finding } from "@/lib/rules/types";

/**
 * Landlord Message Builder (spec.md > Landlord Message Builder).
 * A template stitched from the rules' fixed sentences: no AI, nothing invented.
 */

function clauseLabel(f: Finding, clauses: Clause[], lang: "es" | "en"): string {
  const refs = [...new Set(f.clauseIndices.map((i) => clauses[i]?.clause_ref).filter(Boolean))] as string[];
  if (refs.length === 0) return lang === "es" ? "El contrato" : "The contract";
  const title = refs.some((r) => /^T[IÍ]TULO$/i.test(r));
  const rest = refs.filter((r) => !/^T[IÍ]TULO$/i.test(r)).map((r) => r.toLowerCase());
  const parts: string[] = [];
  if (title) parts.push(lang === "es" ? "Título" : "Title");
  if (rest.length) parts.push(`${lang === "es" ? (rest.length > 1 ? "Cláusulas" : "Cláusula") : rest.length > 1 ? "Clauses" : "Clause"} ${rest.join(", ")}`);
  return parts.join(lang === "es" ? " y " : " and ");
}

function articleEs(article: string): string {
  return article
    .replace(/^LAU arts?\. ([\d.]+(?: and [\d.]+)?)/, (_, a: string) => `art. ${a.replace(" and ", " y ")} de la LAU`)
    .replace("Spanish Constitution art. 18.2", "art. 18.2 de la Constitución")
    .replace("Ley 7/1985 (LBRL) art. 15", "art. 15 de la Ley 7/1985 de Bases de Régimen Local")
    .replace("(since 8 Oct 2026)", "(desde el 8 de octubre de 2026)")
    .replace("(pending Congress vote)", "(pendiente de convalidación)");
}

export function buildLetter(findings: Finding[], clauses: Clause[], lang: "es" | "en"): string | null {
  const items = findings.filter((f) => f.verdict === "ILLEGAL" && f.askInstead);
  if (items.length === 0) return null;
  const lines = items.map((f, n) => {
    const ask = lang === "es" ? f.askInstead!.es : f.askInstead!.en;
    const mentionsLaw = /art[íi]culo|article/i.test(ask);
    const ref = mentionsLaw ? "" : ` (${lang === "es" ? articleEs(f.law.article) : f.law.article})`;
    return `${n + 1}. ${clauseLabel(f, clauses, lang)}: ${ask}${ref}`;
  });
  if (lang === "es") {
    return [
      "Hola:",
      "",
      "Gracias por enviarme el contrato. Antes de firmarlo he revisado algunas cláusulas y, según la Ley de Arrendamientos Urbanos y otras normas vigentes, estas no serían exigibles. Os propongo cambiarlas:",
      "",
      ...lines,
      "",
      "Quedo a la espera de vuestra respuesta.",
      "Un saludo,",
    ].join("\n");
  }
  return [
    "Hello,",
    "",
    "Thank you for sending me the contract. Before signing it I've checked some clauses, and under the Spanish Tenancy Act (LAU) and other rules in force, these wouldn't be enforceable. I'd like to propose these changes:",
    "",
    ...lines,
    "",
    "I look forward to hearing from you.",
    "Best regards,",
  ].join("\n");
}
