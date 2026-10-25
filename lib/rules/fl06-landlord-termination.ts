import type { Clause } from "@/lib/extraction";
import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, minYears, ofTopic } from "./helpers";

/** Lower-case, accent-free text, so "AÑO", "año" and "ano" read the same. */
const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * What article 9.3 LAU asks of the clause (LEGAL_RULES.md > FL-06), looked for in the quoted words themselves:
 * a need to occupy the flat, for the landlord or a first-degree relative, only after the first year, with
 * two months' notice. A signal says what the model understood; the quote has to back it up.
 */
export function art93Evidence(quote: string): { missing: string[]; otherGround: boolean } {
  const q = plain(quote);
  const missing: string[] = [];
  if (!(/ocupar|necesit/.test(q) && /para si\b|hij[oa]s?\b|padres?\b|madres?\b|conyuge|familiar|primer grado|adopcion/.test(q))) {
    missing.push("a need to live there, for the landlord or a close relative");
  }
  if (!/primer ano|\b(12|doce) meses/.test(q)) missing.push("that it can only happen after the first year");
  if (!(/\b(2|dos)\s*(\(2\)\s*)?meses|\b(60|sesenta)\s*(\(60\)\s*)?dias/.test(q) && /antelacion|preaviso|comunic|avis/.test(q))) {
    missing.push("two months' notice");
  }
  // Any other way out for the landlord: a sale, "at any time", "freely", "without a reason"...
  const otherGround = /vender|venta|enajen|en cualquier momento|libremente|a su (sola )?voluntad|cuando (lo )?desee|discrecional|sin (necesidad de )?(causa|motivo|justificacion|alegar)|por cualquier (causa|motivo|razon)/.test(q);
  return { missing, otherGround };
}

/** FL-06 · The landlord can end the contract early without a legal reason. */
export const fl06: Rule = {
  id: "FL-06",
  name: "Early termination by the landlord",
  evaluate(ctx) {
    const years = minYears(ctx);
    const needSignals = (c: Clause) =>
      has(c, "need_for_landlord_or_family") && c.signals.includes("need_after_first_year") && c.signals.includes("need_notice_two_months");
    return ofTopic(ctx, "landlord_termination").flatMap(({ clause, index, context }) => {
      const natural = ctx.facts.landlord_type === "natural_person";
      // The model sometimes also ticks "landlord_can_terminate" on a clause that only states the art. 9.3 need.
      // That signal alone doesn't decide: the clause's own words (the quote and the paragraph it sits in) have to show
      // another way out, or fail to show the 9.3 conditions.
      const contested = natural && needSignals(clause) && has(clause, "landlord_can_terminate");
      const evidence = art93Evidence(context ?? clause.quote);
      const validNeed = natural && needSignals(clause) && (!has(clause, "landlord_can_terminate") || (!evidence.otherGround && evidence.missing.length === 0));
      if (validNeed) {
        return [
          finding("FL-06", "OK", [index], {
            title: "Landlord's need clause, correctly written",
            body: "A private landlord can recover the flat after the first year for themselves or close family, with two months' notice, only if the contract says so from day one. This clause does.",
            law: LAW.LAU_9_3,
          }),
        ];
      }
      if (contested && !evidence.otherGround) {
        return [
          finding("FL-06", "CHECK", [index], {
            title: "Landlord's need clause: check the wording",
            body: `This clause looks like the one article 9.3 allows, but its text doesn't show ${evidence.missing.join(", ")}. A private landlord can recover the flat early only for themselves or close family, after the first year and with two months' notice, and only if the contract says so from day one.`,
            law: LAW.LAU_9_3,
          }),
        ];
      }
      return [
        finding("FL-06", "ILLEGAL", [index], {
          title: "Lets the landlord end the contract early",
          body: `In the first ${years} years the landlord can only take the flat back for one reason: they or close family need to live in it, and only if the contract said so from day one. This clause goes further.`,
          law: LAW.LAU_9_3,
          askInstead: {
            en: "The landlord can only recover the flat early in the case set out in article 9.3 LAU. Can we limit this clause to that case?",
            es: "El arrendador solo puede recuperar la vivienda antes en el supuesto del artículo 9.3 de la LAU. ¿Limitamos la cláusula a ese caso?",
          },
        }),
      ];
    });
  },
};
