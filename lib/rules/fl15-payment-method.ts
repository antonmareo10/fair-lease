import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, isAorB, isC, ofTopic } from "./helpers";

/** FL-15 · Rent payable only in cash (texts since May 2023 require electronic payment). */
export const fl15: Rule = {
  id: "FL-15",
  name: "Cash-only rent",
  evaluate(ctx) {
    const electronicRule = ctx.law.regime === "B" || isC(ctx);
    return ofTopic(ctx, "payment_method").flatMap(({ clause, index }) => {
      if (has(clause, "cash_only") && electronicRule) {
        return [
          finding("FL-15", "CHECK", [index], {
            title: "Rent in cash only",
            body: "By default rent is paid electronically, which also gives you proof of payment. Cash only if one side has no bank account and asks for it.",
            law: LAW.LAU_17_3,
            askInstead: {
              en: "Article 17.3 LAU says rent is paid electronically. Can we pay by bank transfer?",
              es: "El artículo 17.3 de la LAU dice que la renta se paga por medios electrónicos. ¿Podemos pagarla por transferencia?",
            },
          }),
        ];
      }
      if (has(clause, "bank_transfer") && (electronicRule || isAorB(ctx))) {
        return [
          finding("FL-15", "OK", [index], {
            title: "Rent by bank transfer",
            body: "Paying electronically is what the law expects, and it gives you proof of every payment.",
            law: LAW.LAU_17_3,
          }),
        ];
      }
      return [];
    });
  },
};
