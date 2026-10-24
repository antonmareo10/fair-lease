import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, has, isC, isCompany, minYears, months, ofTopic, rentMonthsOf } from "./helpers";

/** FL-02 · Extra guarantees above two months (one for valid temporary contracts since Oct 2026). */
export const fl02: Rule = {
  id: "FL-02",
  name: "Extra guarantees above the cap",
  evaluate(ctx) {
    const rent = ctx.facts.monthly_rent_eur;
    const guarantees = ofTopic(ctx, "extra_guarantee");
    if (guarantees.length === 0) return [];

    const depositExcess = ofTopic(ctx, "deposit").reduce((sum, { clause }) => {
      const m = rentMonthsOf(clause, rent);
      return sum + (m != null && m > 1 ? m - 1 : 0);
    }, 0);
    const guaranteeMonths = guarantees.map(({ clause }) => rentMonthsOf(clause, rent));
    const indices = guarantees.map((g) => g.index);

    if (guarantees.some(({ clause }) => has(clause, "third_party_guarantor")) || guaranteeMonths.some((m) => m == null)) {
      return [
        finding("FL-02", "CHECK", indices, {
          title: "Extra guarantee without a clear amount",
          body: "On top of the deposit, extra guarantees can be worth at most two months' rent. This one has no clear maximum, so check how much it really commits you to.",
          law: LAW.LAU_36_5,
        }),
      ];
    }

    const longContract = (ctx.facts.duration_months ?? 0) > minYears(ctx) * 12;
    const validTemporary = isC(ctx) && ctx.facts.contract_kind === "temporal" && !!ctx.facts.temporal_cause;
    const cap = validTemporary ? 1 : 2;
    const extra = depositExcess + guaranteeMonths.reduce<number>((a, m) => a + (m ?? 0), 0);

    if (!longContract && extra > cap + 0.001) {
      const excess = rent ? (extra - cap) * rent : null;
      return [
        finding("FL-02", "ILLEGAL", indices, {
          title: "Extra guarantees above the legal limit",
          body: `On top of the one-month deposit, a landlord can ask for extra guarantees worth at most ${months(cap)}' rent in total (for contracts up to ${minYears(ctx)} years${isCompany(ctx) ? ", as the landlord is a company" : ""}). This contract asks for ${months(extra)}${depositExcess > 0 ? `, counting the deposit above one month` : ""}.`,
          number: excess != null ? `${months(extra)} of guarantees · ${eur(excess)} over the limit` : `${months(extra)} of guarantees`,
          law: LAW.LAU_36_5,
          askInstead: {
            en: `The extra guarantees add up to ${months(extra)}; article 36.5 LAU caps them at ${cap === 1 ? "one" : "two"}. Can we bring them down to ${months(cap)}?`,
            es: `Las garantías adicionales suman ${extra.toLocaleString("es-ES")} ${extra === 1 ? "mes" : "meses"} y el artículo 36.5 de la LAU las limita a ${cap === 1 ? "una" : "dos"}. ¿Podemos dejarlas en ${cap === 1 ? "una mensualidad" : "dos meses"}?`,
          },
        }),
      ];
    }

    return [
      finding("FL-02", "OK", indices, {
        title: "Extra guarantee within the limit",
        body: longContract
          ? "For contracts longer than five years (seven with a company landlord) the two-month cap doesn't apply."
          : `Extra guarantees of ${months(extra)} are within the ${months(cap)} the law allows.`,
        law: LAW.LAU_36_5,
      }),
    ];
  },
};
