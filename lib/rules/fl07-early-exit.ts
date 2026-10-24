import type { Rule } from "./types";
import { LAW } from "./texts";
import { amountOf, eur, finding, has, isC, ofTopic } from "./helpers";

/** FL-07 · Penalty for leaving early. Allowed up to one month per year left (A/B); none since Oct 2026 (C). */
export const fl07: Rule = {
  id: "FL-07",
  name: "Early-exit penalty",
  evaluate(ctx) {
    const rent = ctx.facts.monthly_rent_eur;
    const duration = ctx.facts.duration_months;
    const deposit = ofTopic(ctx, "deposit").reduce((sum, { clause }) => sum + (amountOf(clause, rent) ?? 0), 0);
    const askInstead = {
      en: "Article 11 LAU caps the early-exit compensation at one month's rent per year remaining. Can we change the clause to that?",
      es: "El artículo 11 de la LAU limita la indemnización por desistimiento a una mensualidad por año que quede. ¿Ajustamos la cláusula a eso?",
    };
    const askInsteadC = {
      en: "For contracts signed since 8 October 2026, article 11.3 LAU says leaving after six months carries no compensation. Can we remove this penalty?",
      es: "En los contratos firmados desde el 8 de octubre de 2026, el artículo 11.3 de la LAU dice que irse pasados seis meses no genera indemnización. ¿Quitamos esta penalización?",
    };

    return ofTopic(ctx, "early_exit").flatMap(({ clause, index }) => {
      // "No leaving in the first six months" is the law, even when the same passage adds a penalty.
      const sixMonths = has(clause, "no_exit_first_6_months")
        ? [
            finding("FL-07", "OK", [index], {
              title: "No leaving in the first six months",
              body: "This is what the law says: you can leave after six months with 30 days' notice.",
              law: isC(ctx) ? LAW.LAU_11_3_C : LAW.LAU_11_AB,
            }),
          ]
        : [];
      return [...sixMonths, ...penalty(clause, index)];
    });

    function penalty(clause: Parameters<typeof has>[0], index: number) {

      if (isC(ctx) && has(clause, "pay_remaining_rent_on_exit", "lose_deposit_on_exit", "compensation_month_per_year")) {
        return [
          finding("FL-07", "ILLEGAL", [index], {
            title: "Charges you for leaving",
            body: "For contracts signed since 8 Oct 2026 the landlord can't charge you anything for leaving after six months.",
            number: "Legal maximum: €0",
            law: LAW.LAU_11_3_C,
            askInstead: askInsteadC,
            newSinceOct2026: true,
          }),
        ];
      }

      if (has(clause, "pay_remaining_rent_on_exit", "lose_deposit_on_exit")) {
        let number: string | undefined;
        if (rent && duration && duration > 6) {
          const remaining = duration - 6;
          const claimed = (has(clause, "pay_remaining_rent_on_exit") ? remaining * rent : 0) + (has(clause, "lose_deposit_on_exit") ? deposit : 0);
          const max = (rent * remaining) / 12;
          number = `Leaving at month 6: asks ${eur(claimed)} · legal maximum ${eur(max)}`;
        }
        return [
          finding("FL-07", "ILLEGAL", [index], {
            title: "Penalty for leaving early above the legal limit",
            body: "After six months you can leave with 30 days' notice. For contracts signed before 8 Oct 2026, the most the landlord can charge is one month's rent per year left, prorated. Losing the deposit or paying all the remaining rent goes beyond that.",
            number,
            law: LAW.LAU_11_AB,
            askInstead,
          }),
        ];
      }

      if (has(clause, "compensation_month_per_year")) {
        return [
          finding("FL-07", "OK", [index], {
            title: "Early-exit compensation within the limit",
            body: "One month's rent per year left, prorated, is what the law allowed for contracts signed before 8 Oct 2026.",
            law: LAW.LAU_11_AB,
          }),
        ];
      }

      if (clause.numbers.days != null && clause.numbers.days > 30) {
        return [
          finding("FL-07", "ILLEGAL", [index], {
            title: "Notice period longer than the law allows",
            body: "After six months you can leave with 30 days' notice. The contract can't ask for more.",
            number: `${clause.numbers.days} days' notice asked · 30 allowed`,
            law: isC(ctx) ? LAW.LAU_11_3_C : LAW.LAU_11_AB,
            askInstead,
          }),
        ];
      }
      return [];
    }
  },
};
