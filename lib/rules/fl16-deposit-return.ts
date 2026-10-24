import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, ofTopic } from "./helpers";

/** FL-16 · Deposit returned late, without interest, or kept as a penalty. */
export const fl16: Rule = {
  id: "FL-16",
  name: "Deposit return",
  evaluate(ctx) {
    return ofTopic(ctx, "deposit_return").flatMap(({ clause, index }) => {
      const days = clause.numbers.days;
      const monthsToReturn = clause.numbers.months;
      const late = (days != null && days > 31) || (monthsToReturn != null && monthsToReturn > 1);
      if (late || has(clause, "deposit_no_interest", "deposit_forfeit")) {
        const parts: string[] = [];
        if (monthsToReturn != null && monthsToReturn > 1) parts.push(`Returned in ${monthsToReturn} months`);
        else if (days != null && days > 31) parts.push(`Returned in ${days} days`);
        if (has(clause, "deposit_no_interest")) parts.push("no interest");
        return [
          finding("FL-16", "CHECK", [index], {
            title: "Deposit returned late or without interest",
            body: "The landlord should return your deposit within a month of getting the keys back; after that it earns legal interest. They can only keep what covers real damage or unpaid bills.",
            number: parts.length ? `${parts.join(", ")} · legal interest after 1 month` : undefined,
            law: LAW.LAU_36_4,
            askInstead: {
              en: "Under article 36.4 LAU the deposit earns legal interest if it isn't returned within a month of handing back the keys. Can we write one month?",
              es: "Según el artículo 36.4 de la LAU, la fianza devenga el interés legal si no se devuelve en un mes desde la entrega de llaves. ¿Ponemos un mes?",
            },
          }),
        ];
      }
      if (has(clause, "return_after_deductions")) {
        return [
          finding("FL-16", "OK", [index], {
            title: "Deposit returned minus real damage",
            body: "Returning the deposit at the end, minus real damage or unpaid amounts, is what the law allows.",
            law: LAW.LAU_36_4,
          }),
        ];
      }
      return [];
    });
  },
};
