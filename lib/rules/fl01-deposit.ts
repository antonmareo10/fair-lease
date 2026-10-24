import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, isAorB, isSeasonal, months, ofTopic, rentMonthsOf } from "./helpers";

/** FL-01 · Deposit (fianza) above one month. LEGAL_RULES.md §3 FL-01. */
export const fl01: Rule = {
  id: "FL-01",
  name: "Deposit above one month",
  evaluate(ctx) {
    // For seasonal contracts under the 2019/2023 texts the legal deposit is two months: not ours to flag.
    if (isSeasonal(ctx) && isAorB(ctx)) return [];
    const rent = ctx.facts.monthly_rent_eur;
    return ofTopic(ctx, "deposit").flatMap(({ clause, index }) => {
      const m = rentMonthsOf(clause, rent);
      if (m == null) return [];
      if (m > 1.001) {
        const excess = rent ? (m - 1) * rent : null;
        return [
          finding("FL-01", "CHECK", [index], {
            title: "Deposit above one month's rent",
            body: "The legal deposit (fianza) for a home is exactly one month's rent. Anything above that is not a deposit: it counts as an extra guarantee, and the law caps those.",
            number: excess != null ? `${months(m)} asked · ${eur(excess)} above one month` : `${months(m)} asked`,
            law: LAW.LAU_36_1,
            askInstead: {
              en: "Could we set the deposit at one month's rent, as article 36.1 of the LAU says?",
              es: "¿Podemos dejar la fianza en una mensualidad, como fija el artículo 36.1 de la LAU?",
            },
          }),
        ];
      }
      return [
        finding("FL-01", "OK", [index], {
          title: "One-month deposit",
          body: "A deposit of one month's rent is exactly what the law requires.",
          law: LAW.LAU_36_1,
        }),
      ];
    });
  },
};
