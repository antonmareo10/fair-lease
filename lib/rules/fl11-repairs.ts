import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, ofTopic } from "./helpers";

/** FL-11 · All repairs charged to the tenant. */
export const fl11: Rule = {
  id: "FL-11",
  name: "All repairs on the tenant",
  evaluate(ctx) {
    return ofTopic(ctx, "repairs").flatMap(({ clause, index }) => {
      if (has(clause, "all_repairs_tenant")) {
        return [
          finding("FL-11", "ILLEGAL", [index], {
            title: "Makes you pay for every repair",
            body: "The landlord must pay for every repair needed to keep the flat liveable. You only pay small fixes from normal use, or damage you caused. Making you pay for the boiler or the plumbing is not allowed.",
            law: LAW.LAU_21,
            askInstead: {
              en: "Under article 21 LAU, repairs needed to keep the flat habitable are the landlord's. Can we limit my part to small repairs from ordinary use?",
              es: "Según el artículo 21 de la LAU, las reparaciones necesarias para la habitabilidad son del arrendador. ¿Limitamos mi parte a las pequeñas reparaciones por el uso ordinario?",
            },
          }),
        ];
      }
      if (has(clause, "repairs_per_law")) {
        return [
          finding("FL-11", "OK", [index], {
            title: "Repairs split as the law says",
            body: "The landlord pays the repairs that keep the flat habitable; you pay small fixes from ordinary use.",
            law: LAW.LAU_21,
          }),
        ];
      }
      return [];
    });
  },
};
