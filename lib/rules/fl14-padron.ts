import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, ofTopic } from "./helpers";

/** FL-14 · Registering at the address (empadronamiento) forbidden. */
export const fl14: Rule = {
  id: "FL-14",
  name: "Ban on registering at the address",
  evaluate(ctx) {
    return ofTopic(ctx, "padron").flatMap(({ clause, index }) =>
      has(clause, "padron_forbidden")
        ? [
            finding("FL-14", "ILLEGAL", [index], {
              title: "Forbids you to register at the address",
              body: "Registering at your address (empadronamiento) is a legal duty for everyone who lives in Spain, and you need it for many procedures. A contract can't forbid it.",
              law: LAW.LBRL_15,
              askInstead: {
                en: "Registering at my address is a legal duty (article 15 of the Local Government Act). Can we remove this clause?",
                es: "Empadronarme es una obligación legal (art. 15 de la Ley de Bases de Régimen Local). ¿Quitamos esta cláusula?",
              },
            }),
          ]
        : [],
    );
  },
};
