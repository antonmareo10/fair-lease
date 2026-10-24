import type { Rule } from "./types";
import { LAW } from "./texts";
import { eur, finding, has, isCompany, ofTopic } from "./helpers";

/** FL-03 · Agency or contract-preparation fees charged to the tenant. */
export const fl03: Rule = {
  id: "FL-03",
  name: "Agency fees charged to the tenant",
  evaluate(ctx) {
    const { regime } = ctx.law;
    const law = regime === "C" ? LAW.LAU_20_2_FEES_C : regime === "A" ? LAW.LAU_20_1_FEES_A : LAW.LAU_20_1_FEES_B;
    return ofTopic(ctx, "agency_fee").flatMap(({ clause, index }) => {
      const tenantPays = clause.payer === "tenant" && !has(clause, "landlord_pays_fees");
      if (!tenantPays) {
        return [
          finding("FL-03", "OK", [index], {
            title: "Agency fees paid by the landlord",
            body: "Agency and contract-preparation fees are the landlord's to pay, and this clause says so.",
            law,
          }),
        ];
      }
      if (regime === "pre2019") return [];
      if (regime === "A" && !isCompany(ctx)) {
        return [
          finding("FL-03", "OK", [index], {
            title: "Agency fee (allowed before May 2023 with a private landlord)",
            body: "For contracts signed before 26 May 2023 with a private landlord, the tenant could be charged these fees. This changed on 26 May 2023.",
            law,
          }),
        ];
      }
      const amount = clause.numbers.amount_eur;
      const askInstead = {
        en: "Under article 20 of the LAU, agency and contract-preparation fees are the landlord's to pay. Please remove this charge.",
        es: "Según el artículo 20 de la LAU, los gastos de gestión inmobiliaria y de formalización corresponden al arrendador. Os pido que quitéis este cargo.",
      };
      if (has(clause, "optional_service")) {
        return [
          finding("FL-03", "CHECK", [index], {
            title: "Service fee described as optional",
            body: "A truly optional service you asked for in writing can be charged to you. Anything needed to prepare or sign the contract can't.",
            number: amount != null ? `${eur(amount)} charged to you` : undefined,
            law,
            askInstead,
          }),
        ];
      }
      return [
        finding("FL-03", "ILLEGAL", [index], {
          title: "Agency fees charged to you",
          body:
            regime === "A"
              ? "When the landlord is a company, agency and contract-preparation fees must be paid by the landlord, not by you."
              : "Since May 2023, agency and contract-preparation fees must be paid by the landlord, not by you.",
          number: amount != null ? `${eur(amount)} charged to you` : undefined,
          law,
          askInstead,
        }),
      ];
    });
  },
};
