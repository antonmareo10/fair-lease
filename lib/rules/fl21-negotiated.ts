import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, ofTopic } from "./helpers";

/** FL-21 · "Both parties declare every clause was negotiated individually" (TRLGDCU 82.2, LEGAL_RULES.md > FL-21). */
export const fl21: Rule = {
  id: "FL-21",
  name: "Negotiated-clauses boilerplate",
  evaluate(ctx) {
    return ofTopic(ctx, "negotiated_boilerplate").flatMap(({ clause, index }) =>
      has(clause, "declares_individual_negotiation")
        ? [
            finding("FL-21", "CHECK", [index], {
              title: "“Every clause was negotiated”",
              body: "Signing a sentence that says every clause was negotiated doesn't make unfair clauses valid. If the landlord is a business, it's on them to prove real negotiation.",
              law: LAW.TRLGDCU_82_2,
              askInstead: {
                en: "Can we remove the sentence saying every clause was negotiated individually?",
                es: "¿Podemos quitar la frase que dice que todas las cláusulas se han negociado individualmente?",
              },
            }),
          ]
        : [],
    );
  },
};
