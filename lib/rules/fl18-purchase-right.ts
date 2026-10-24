import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, isC, ofTopic } from "./helpers";

/** FL-18 · Waiver of the tenant's preferential right to buy (banned since 8 Oct 2026). */
export const fl18: Rule = {
  id: "FL-18",
  name: "Waiver of the right to buy first",
  evaluate(ctx) {
    return ofTopic(ctx, "purchase_right").flatMap(({ clause, index }) => {
      if (!has(clause, "waives_preferential_purchase")) return [];
      if (isC(ctx)) {
        return [
          finding("FL-18", "ILLEGAL", [index], {
            title: "Takes away your right to buy first",
            body: "Since 8 Oct 2026 a contract can't make you give up your right to buy the flat first if it's sold.",
            law: LAW.LAU_25_8_C,
            askInstead: {
              en: "Since 8 October 2026, article 25.8 LAU doesn't allow the tenant to waive the preferential right to buy. Can we remove this clause?",
              es: "Desde el 8 de octubre de 2026, el artículo 25.8 de la LAU no permite pactar la renuncia al derecho de adquisición preferente. ¿Quitamos esta cláusula?",
            },
            newSinceOct2026: true,
          }),
        ];
      }
      return [
        finding("FL-18", "OK", [index], {
          title: "Waiver of the right to buy first",
          body: "For contracts signed before 8 Oct 2026 this waiver was allowed. The landlord must still tell you 30 days before selling.",
          law: LAW.LAU_25_8_AB,
        }),
      ];
    });
  },
};
