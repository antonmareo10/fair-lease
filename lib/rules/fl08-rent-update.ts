import type { Finding, Rule } from "./types";
import { DF6_WINDOW, IRAV_PERCENT, LAW } from "./texts";
import { formatLongDate, nextAnniversary } from "@/lib/law";
import { finding, has, ofTopic } from "./helpers";

/**
 * FL-08 · Rent update above the legal index or more than once a year,
 * plus the "Your right" notes: no update clause, and the 2 % cap of DF 6ª RDL 29/2026.
 */
export const fl08: Rule = {
  id: "FL-08",
  name: "Rent update above the index or out of time",
  evaluate(ctx) {
    const updates = ofTopic(ctx, "rent_update");
    const law = ctx.law.regime === "C" ? LAW.LAU_18_1_C : LAW.LAU_18_1_B;
    const askInstead = {
      en: "Article 18 LAU caps yearly increases at the INE reference index (IRAV). Can we write the update as 'annual variation of the IRAV'?",
      es: "El artículo 18 de la LAU limita la subida anual a la variación del IRAV del INE. ¿Ponemos la actualización como 'variación anual del IRAV'?",
    };

    if (updates.length === 0) {
      return [
        finding("FL-08", "INFO", [], {
          title: "Your rent can't go up during the contract",
          body: "The contract has no rent-update clause, and without one the rent stays the same.",
          law: LAW.LAU_18_1_B,
        }),
      ];
    }

    const out: Finding[] = [];
    for (const { clause, index } of updates) {
      const problems: string[] = [];
      const every = clause.numbers.every_months;
      if (every != null && every < 12) problems.push(`it updates every ${every} months instead of once a year`);
      if (has(clause, "landlord_may_revise")) problems.push("the landlord can revise the rent at will");
      if (has(clause, "index_plus_points")) {
        problems.push(`it adds ${clause.numbers.percent != null ? `${clause.numbers.percent} points` : "extra points"} on top of the index`);
      }
      const regimeCapsAtIrav = ctx.law.regime === "B" || ctx.law.regime === "C";
      if (has(clause, "fixed_percent") && clause.numbers.percent != null && regimeCapsAtIrav && clause.numbers.percent > IRAV_PERCENT) {
        problems.push(`a fixed ${clause.numbers.percent}% is above the official index (IRAV, ${IRAV_PERCENT}% as of Sept 2026)`);
      }

      if (problems.length > 0) {
        out.push(
          finding("FL-08", "ILLEGAL", [index], {
            title: problems.length > 1 ? "Rent update breaks the law twice over" : "Rent update above what the law allows",
            body: `Your rent can only go up once a year, on the contract's anniversary, and never by more than the official INE index (IRAV, ${IRAV_PERCENT}% as of Sept 2026). Here ${problems.join(", and ")}.`,
            number: summarise(every, clause.numbers.percent, has(clause, "index_plus_points")),
            law,
            askInstead,
          }),
        );
      } else if (has(clause, "update_per_art18") || has(clause, "fixed_percent")) {
        out.push(
          finding("FL-08", "OK", [index], {
            title: "Yearly update within the legal index",
            body: "Once a year and capped by the official index: this is how the law says rent can be updated.",
            law,
          }),
        );
      }

      // DF 6ª RDL 29/2026: any home contract whose anniversary falls in the window.
      if (!ctx.law.assumedToday) {
        const anniversary = nextAnniversary(ctx.law.date, DF6_WINDOW.from);
        if (anniversary <= DF6_WINDOW.to) {
          out.push(
            finding("FL-08", "INFO", [index], {
              title: "2% cap on your next rent update",
              body: `Your next update (${formatLongDate(anniversary)}) falls between 8 Oct 2026 and 31 Dec 2027. Unless you agree something new, it can't be more than 2%. This comes from the Oct 2026 reform, which still needs a vote in Congress.`,
              number: "Max +2% without a new agreement",
              law: LAW.RDL_29_DF6,
              newSinceOct2026: true,
            }),
          );
        }
      }
    }
    return out;
  },
};

function summarise(every: number | null, percent: number | null, plusPoints: boolean): string | undefined {
  const parts: string[] = [];
  if (every != null && every < 12) parts.push(`Every ${every} months`);
  if (plusPoints) parts.push(percent != null ? `index + ${percent} points` : "index + extra points");
  return parts.length ? parts.join(" · ") : undefined;
}
