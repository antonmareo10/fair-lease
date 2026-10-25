import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, has, isCompany, ofTopic } from "./helpers";

/** Consumo (22 May 2026): courts treat a late-handover penalty of three times the daily rent as abusive. */
const ABUSIVE_MULTIPLE = 3;

/** FL-20 · A disproportionate penalty for handing the keys back late (TRLGDCU 85.6, LEGAL_RULES.md > FL-20). */
export const fl20: Rule = {
  id: "FL-20",
  name: "Late-handover penalty",
  evaluate(ctx) {
    const dailyRent = ctx.facts.monthly_rent_eur ? ctx.facts.monthly_rent_eur / 30 : null;
    return ofTopic(ctx, "late_handover_penalty").flatMap(({ clause, index }) => {
      const perDay = clause.numbers.amount_eur;
      const multiple = perDay != null && dailyRent ? perDay / dailyRent : has(clause, "penalty_three_times_daily_rent") ? ABUSIVE_MULTIPLE : null;
      if (multiple == null || multiple < ABUSIVE_MULTIPLE - 0.05) return [];
      const company = isCompany(ctx);
      return [
        finding("FL-20", company ? "ILLEGAL" : "CHECK", [index], {
          title: "Penalty for a late handover",
          body: company
            ? "A penalty for handing the keys back late is allowed, but not a disproportionate one. With a company as landlord, consumer law applies, and courts have struck down penalties of three times the daily rent per day."
            : "A penalty for handing the keys back late is allowed, but not a disproportionate one. Courts have struck down penalties of three times the daily rent per day. Consumer law applies when the landlord is a business; with a private landlord, a judge can still reduce the penalty.",
          number:
            perDay != null && dailyRent
              ? `${eur(perDay)} a day · ${Math.round(multiple * 10) / 10}× the daily rent of ${eur(dailyRent)}`
              : dailyRent
                ? `About ${eur(dailyRent * multiple)} a day · ${multiple}× the daily rent`
                : undefined,
          law: LAW.TRLGDCU_85_6,
          askInstead: {
            en: "Can we lower the penalty for a late handover? Courts have found three times the daily rent per day disproportionate (article 85.6 of the consumer law, TRLGDCU).",
            es: "¿Podemos rebajar la penalización por retraso en la entrega? Los tribunales han considerado desproporcionado el triple de la renta diaria por día (artículo 85.6 del TRLGDCU).",
          },
        }),
      ];
    });
  },
};
