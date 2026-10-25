import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, minYears, ofTopic } from "./helpers";

/** FL-12 · "If the flat is sold, the contract ends." The buyer takes over the lease for the first 5 (or 7) years. */
export const fl12: Rule = {
  id: "FL-12",
  name: "Sale ends the lease",
  evaluate(ctx) {
    const years = minYears(ctx);
    return ofTopic(ctx, "sale", "landlord_termination").flatMap(({ clause, index }) =>
      has(clause, "sale_ends_lease")
        ? [
            finding("FL-12", "ILLEGAL", [index], {
              title: "A sale doesn't end your lease",
              body: `If the flat is sold, the buyer takes over your contract for at least the first ${years} years${years === 7 ? ", because the landlord is a company" : " (seven with a company landlord)"}. A clause saying the sale ends the contract can't take that away.`,
              law: LAW.LAU_14,
              askInstead: {
                en: `Please remove this clause: under article 14 LAU a sale doesn't end the lease in the first ${years} years.`,
                es: `Os pido quitar esta cláusula: por el artículo 14 de la LAU la venta no extingue el contrato en los primeros ${years === 7 ? "siete" : "cinco"} años.`,
              },
            }),
          ]
        : [],
    );
  },
};
