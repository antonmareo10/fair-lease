import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, ofTopic } from "./helpers";

/** FL-13 · The landlord can enter whenever they like. */
export const fl13: Rule = {
  id: "FL-13",
  name: "Landlord entry without consent",
  evaluate(ctx) {
    return ofTopic(ctx, "landlord_entry").flatMap(({ clause, index }) => {
      if (has(clause, "entry_without_consent")) {
        return [
          finding("FL-13", "ILLEGAL", [index], {
            title: "Landlord can come in whenever they like",
            body: "Once you live there, the flat is your home and is legally protected: the landlord can't come in without your permission. Visits by appointment for repairs are fine.",
            law: LAW.CE_18_2,
            askInstead: {
              en: "Can we change this to visits by prior appointment, agreed with me?",
              es: "¿Podemos cambiarlo por visitas con cita previa acordada conmigo?",
            },
          }),
        ];
      }
      if (has(clause, "entry_by_appointment")) {
        return [
          finding("FL-13", "OK", [index], {
            title: "Visits by appointment",
            body: "Visits agreed with you in advance, for example to check repairs, are fine.",
            law: LAW.CE_18_2,
          }),
        ];
      }
      return [];
    });
  },
};
