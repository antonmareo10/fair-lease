import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, minYears, ofTopic } from "./helpers";

/** FL-06 · The landlord can end the contract early without a legal reason. */
export const fl06: Rule = {
  id: "FL-06",
  name: "Early termination by the landlord",
  evaluate(ctx) {
    const years = minYears(ctx);
    return ofTopic(ctx, "landlord_termination").flatMap(({ clause, index }) => {
      const validNeed =
        ctx.facts.landlord_type === "natural_person" &&
        has(clause, "need_for_landlord_or_family") &&
        clause.signals.includes("need_after_first_year") &&
        clause.signals.includes("need_notice_two_months") &&
        !has(clause, "landlord_can_terminate");
      if (validNeed) {
        return [
          finding("FL-06", "OK", [index], {
            title: "Landlord's need clause, correctly written",
            body: "A private landlord can recover the flat after the first year for themselves or close family, with two months' notice, only if the contract says so from day one. This clause does.",
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
