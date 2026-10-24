import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, ofTopic } from "./helpers";

/**
 * Clauses that can feel harsh but are legal (LEGAL_RULES.md §4). Showing them in
 * green keeps the tool fair rather than alarmist. These are not counted among the FL rules.
 */
export const knownLegal: Rule = {
  id: "OK",
  name: "Legal, even if it feels harsh",
  evaluate(ctx) {
    return [
      ...ofTopic(ctx, "utilities").flatMap(({ clause, index }) =>
        has(clause, "utilities_by_meter")
          ? [finding("OK-UTILITIES", "OK", [index], { title: "Utilities with their own meter", body: "Water, electricity and gas with individual meters are always the tenant's: that's the law.", law: LAW.LAU_20_3 })]
          : [],
      ),
      ...ofTopic(ctx, "pets").flatMap(({ clause, index }) =>
        has(clause, "pets_forbidden")
          ? [finding("OK-PETS", "OK", [index], { title: "No pets", body: "The law doesn't stop a landlord from banning pets: it's a free agreement between the parties.", law: LAW.LAU_4_2 })]
          : [],
      ),
      ...ofTopic(ctx, "sublet").flatMap(({ clause, index }) =>
        has(clause, "sublet_needs_permission")
          ? [finding("OK-SUBLET", "OK", [index], { title: "No subletting without permission", body: "Needing the landlord's written consent to sublet or assign the contract is exactly what the law says.", law: LAW.LAU_8 })]
          : [],
      ),
      ...ofTopic(ctx, "works").flatMap(({ clause, index }) =>
        has(clause, "works_need_permission")
          ? [finding("OK-WORKS", "OK", [index], { title: "No works without permission", body: "Needing the landlord's written consent for works that change the flat is what the law says.", law: LAW.LAU_23_1 })]
          : [],
      ),
    ];
  },
};
