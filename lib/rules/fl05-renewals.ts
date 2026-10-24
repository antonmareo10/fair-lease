import type { Rule } from "./types";
import { LAW } from "./texts";
import { endOfTerm, formatLongDate } from "@/lib/law";
import { finding, has, isSeasonal, minYears, ofTopic } from "./helpers";

/** FL-05 · Waiver of the legal yearly extensions up to five (or seven) years. */
export const fl05: Rule = {
  id: "FL-05",
  name: "Waiver of the legal extensions",
  evaluate(ctx) {
    if (isSeasonal(ctx)) return []; // seasonal contracts are handled by FL-19
    const years = minYears(ctx);
    return ofTopic(ctx, "duration_renewal").flatMap(({ clause, index }) => {
      if (has(clause, "no_renewal", "waives_art9")) {
        const until = ctx.law.assumedToday ? null : endOfTerm(ctx.law.date, years);
        return [
          finding("FL-05", "ILLEGAL", [index], {
            title: "Says you can't stay past the first term",
            body: `Even if the contract says one year, you can stay year by year until it reaches ${years} years${years === 7 ? " (the landlord is a company)" : ""}. Only you can choose to leave at each renewal. A clause that takes this away is void.`,
            number: until ? `You can stay until ${formatLongDate(until)}` : `You can stay up to ${years} years`,
            law: LAW.LAU_9_1,
            askInstead: {
              en: "This clause conflicts with article 9.1 LAU, and article 6 makes it void. Can we delete it so the contract reflects the legal renewals?",
              es: "Esta cláusula choca con el artículo 9.1 de la LAU y el artículo 6 la hace nula. ¿La quitamos para que el contrato refleje las prórrogas legales?",
            },
          }),
        ];
      }
      if (has(clause, "renewal_per_law")) {
        return [
          finding("FL-05", "OK", [index], {
            title: "Legal yearly extensions",
            body: `The contract repeats your right to extend it year by year up to ${years} years.`,
            law: LAW.LAU_9_1,
          }),
        ];
      }
      return [];
    });
  },
};
