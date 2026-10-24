import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, has, isC, ofTopic } from "./helpers";

/** FL-10 · Property tax (IBI) and other taxes passed on to the tenant. */
export const fl10: Rule = {
  id: "FL-10",
  name: "Property taxes charged to the tenant",
  evaluate(ctx) {
    return ofTopic(ctx, "taxes").flatMap(({ clause, index }) => {
      if (clause.payer !== "tenant") return [];
      const annual = clause.numbers.annual_amount_eur;
      if (has(clause, "waste_tax")) {
        return [
          finding("FL-10", "CHECK", [index], {
            title: "Waste collection charge",
            body: "In Madrid the occupant may be the one who legally owes the waste charge. It isn't clear-cut, so check before accepting it.",
            law: isC(ctx) ? LAW.LAU_20_1_TAXES_C : LAW.LAU_20_1_COMMUNITY,
          }),
        ];
      }
      if (isC(ctx)) {
        return [
          finding("FL-10", "ILLEGAL", [index], {
            title: "Property tax passed on to you",
            body: "Since 8 Oct 2026, property taxes like IBI can't be passed on to tenants.",
            number: annual != null ? `${eur(annual)} a year` : undefined,
            law: LAW.LAU_20_1_TAXES_C,
            askInstead: {
              en: "Since 8 October 2026, article 20.1 LAU doesn't allow the property's taxes to be passed on to the tenant. Can we remove the IBI from my side?",
              es: "Desde el 8 de octubre de 2026, el artículo 20.1 de la LAU no permite repercutir al arrendatario los tributos de la vivienda. ¿Quitamos el IBI de mi parte?",
            },
            newSinceOct2026: true,
          }),
        ];
      }
      if (annual != null || has(clause, "annual_amount_stated")) {
        return [
          finding("FL-10", "OK", [index], {
            title: "Property tax with the yearly amount",
            body: "For contracts signed before 8 Oct 2026, IBI can be passed on if the yearly amount is written in the contract, as here.",
            number: annual != null ? `${eur(annual)} a year` : undefined,
            law: LAW.LAU_20_1_COMMUNITY,
          }),
        ];
      }
      return [
        finding("FL-10", "ILLEGAL", [index], {
          title: "Property tax with no yearly amount",
          body: "For contracts signed before 8 Oct 2026, IBI can be passed on only if the yearly amount is written in the contract. This one doesn't state it.",
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
