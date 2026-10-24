import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, months, ofTopic, rentMonthsOf } from "./helpers";

/** FL-04 · More than one month of rent required in advance. */
export const fl04: Rule = {
  id: "FL-04",
  name: "Rent in advance above one month",
  evaluate(ctx) {
    const rent = ctx.facts.monthly_rent_eur;
    return ofTopic(ctx, "prepayment").flatMap(({ clause, index }) => {
      const m = rentMonthsOf(clause, rent);
      if (m == null) return [];
      if (m > 1.001) {
        const extra = m - 1;
        return [
          finding("FL-04", "ILLEGAL", [index], {
            title: "More than one month's rent up front",
            body: `A landlord can never require more than one month's rent in advance. This clause asks for ${months(m)} up front.`,
            number: rent ? `${months(extra)} too many · ${eur(extra * rent)}` : `${months(extra)} too many`,
            law: LAW.LAU_17_2,
            askInstead: {
              en: "Article 17.2 LAU doesn't allow more than one month of rent in advance. Can I pay the first month now and the rest monthly?",
              es: "El artículo 17.2 de la LAU no permite exigir más de una mensualidad por adelantado. ¿Pago el primer mes ahora y el resto mes a mes?",
            },
          }),
        ];
      }
      return [
        finding("FL-04", "OK", [index], {
          title: "First month paid at signing",
          body: "Paying the first month when you sign is normal and allowed.",
          law: LAW.LAU_17_2,
        }),
      ];
    });
  },
};
