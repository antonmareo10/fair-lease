import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, has, ofTopic } from "./helpers";

/** FL-09 · Community fees charged to the tenant without the yearly amount in writing. */
export const fl09: Rule = {
  id: "FL-09",
  name: "Community fees without a yearly amount",
  evaluate(ctx) {
    return ofTopic(ctx, "community_fees").flatMap(({ clause, index }) => {
      if (clause.payer !== "tenant") return [];
      const annual = clause.numbers.annual_amount_eur;
      if (annual != null || has(clause, "annual_amount_stated")) {
        return [
          finding("FL-09", "OK", [index], {
            title: "Community fees with the yearly amount",
            body: "You can be asked to pay community fees when the contract states the yearly amount, as this one does. Yearly increases are capped too.",
            number: annual != null ? `${eur(annual)} a year` : undefined,
            law: LAW.LAU_20_1_COMMUNITY,
          }),
        ];
      }
      return [
        finding("FL-09", "ILLEGAL", [index], {
          title: "Community fees with no yearly amount",
          body: "You can be asked to pay community fees only if the contract states the yearly amount. This one doesn't, so the clause isn't valid.",
          law: LAW.LAU_20_1_COMMUNITY,
          askInstead: {
            en: "Article 20.1 LAU requires the annual amount of these costs to be written in the contract. Could you add it?",
            es: "El artículo 20.1 de la LAU exige que el contrato fije el importe anual de estos gastos. ¿Podéis añadirlo?",
          },
        }),
      ];
    });
  },
};
