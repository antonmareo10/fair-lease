import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, has, isC, ofTopic } from "./helpers";

/** FL-17 · Mandatory rent-default insurance paid by the tenant (banned since 8 Oct 2026). */
export const fl17: Rule = {
  id: "FL-17",
  name: "Mandatory default insurance",
  evaluate(ctx) {
    return ofTopic(ctx, "default_insurance").flatMap(({ clause, index }) => {
      if (!has(clause, "mandatory_default_insurance") && clause.payer !== "tenant") return [];
      const annual = clause.numbers.annual_amount_eur ?? clause.numbers.amount_eur;
      if (isC(ctx)) {
        return [
          finding("FL-17", "ILLEGAL", [index], {
            title: "Makes you pay the landlord's default insurance",
            body: "Since 8 Oct 2026 a landlord can't require you to take out rent-default insurance.",
            number: annual != null ? `${eur(annual)} a year` : undefined,
            law: LAW.LAU_36_5_INSURANCE,
            askInstead: {
              en: "Since 8 October 2026, article 36.5 LAU says the tenant can't be required to take out rent-default insurance. Can we remove this condition?",
              es: "Desde el 8 de octubre de 2026, el artículo 36.5 de la LAU dice que no se puede exigir al arrendatario un seguro de impago. ¿Quitamos esta condición?",
            },
            newSinceOct2026: true,
          }),
        ];
      }
      return [
        finding("FL-17", "INFO", [index], {
          title: "Default insurance: worth asking about",
          body: "Requiring it is banned for contracts signed since 8 Oct 2026. For yours, its cost may count as an agency cost or as an extra guarantee, so it's worth asking.",
          number: annual != null ? `${eur(annual)} a year` : undefined,
          law: LAW.LAU_36_5_INSURANCE,
        }),
      ];
    });
  },
};
