import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, isCompany, ofTopic } from "./helpers";

/** FL-22 · All court and lawyer costs on the tenant, whatever happens (LEC 394, LEGAL_RULES.md > FL-22). */
export const fl22: Rule = {
  id: "FL-22",
  name: "All legal costs on the tenant",
  evaluate(ctx) {
    return ofTopic(ctx, "legal_costs").flatMap(({ clause, index }) =>
      has(clause, "all_legal_costs_tenant")
        ? [
            finding("FL-22", isCompany(ctx) ? "ILLEGAL" : "CHECK", [index], {
              title: "All legal costs on you",
              body: isCompany(ctx)
                ? "Who pays court costs is decided by the judge, not by the contract. With a company as landlord, consumer law applies, and courts have struck down clauses that make the tenant pay all legal costs in any case."
                : "Who pays court costs is decided by the judge, not by the contract. Courts have struck down clauses that make the tenant pay all legal costs in any case.",
              law: LAW.LEC_394_1,
              askInstead: {
                en: "Can we remove this clause? Under article 394 of the Civil Procedure Act (LEC), the court decides who pays the costs.",
                es: "¿Podemos quitar esta cláusula? Según el artículo 394 de la LEC, las costas las decide el juez.",
              },
            }),
          ]
        : [],
    );
  },
};
