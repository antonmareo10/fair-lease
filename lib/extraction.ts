import { z } from "zod";

/**
 * What Claude is allowed to return: facts and literal quotes, never verdicts.
 * The same schema drives the structured-output format sent to the API and the
 * validation we run again on the reply (spec.md > Extraction Schema).
 */

export const TOPICS = [
  "deposit",
  "extra_guarantee",
  "agency_fee",
  "prepayment",
  "duration_renewal",
  "landlord_termination",
  "early_exit",
  "rent_update",
  "community_fees",
  "taxes",
  "repairs",
  "sale",
  "landlord_entry",
  "padron",
  "payment_method",
  "deposit_return",
  "default_insurance",
  "purchase_right",
  "temporal_cause",
  "late_handover_penalty",
  "negotiated_boilerplate",
  "legal_costs",
  "utilities",
  "pets",
  "sublet",
  "works",
  "other",
] as const;

/**
 * Plain facts about what a clause says. Each one maps to a test in
 * LEGAL_RULES.md §3; none of them is a legal judgement.
 */
export const SIGNALS = {
  // duration_renewal
  no_renewal: "The clause says the contract cannot be extended or ends on a fixed date in any case.",
  waives_art9: "The tenant waives the yearly extensions of article 9 LAU.",
  renewal_per_law: "The clause repeats the legal yearly extensions up to five (or seven) years.",
  // landlord_termination
  landlord_can_terminate: "The landlord may end the contract early for reasons other than the tenant breaching it.",
  need_for_landlord_or_family: "Early recovery only so the landlord, a first-degree relative or an ex-spouse can live there.",
  need_after_first_year: "That recovery can only happen after the first year.",
  need_notice_two_months: "That recovery requires at least two months' notice.",
  // early_exit
  no_exit_first_6_months: "The tenant cannot leave during the first six months.",
  pay_remaining_rent_on_exit: "Leaving early means paying all rent until the end of the term.",
  lose_deposit_on_exit: "Leaving early means losing the deposit.",
  compensation_month_per_year: "Leaving early means paying one month's rent per remaining year, prorated.",
  // rent_update
  index_plus_points: "The update adds extra percentage points on top of an index (e.g. CPI + 3).",
  fixed_percent: "The update is a fixed percentage.",
  landlord_may_revise: "The landlord can revise the rent at will.",
  update_per_art18: "The update follows the legal reference index under article 18 LAU.",
  // community_fees / taxes
  annual_amount_stated: "The clause states the yearly amount in euros.",
  waste_tax: "The tax is the municipal waste collection charge.",
  // repairs
  all_repairs_tenant: "The tenant pays for all repairs, including installations, appliances or structural ones.",
  repairs_per_law: "The landlord pays necessary repairs; the tenant only small ones from ordinary use or damage they cause.",
  // landlord_entry
  entry_without_consent: "The landlord can enter whenever they want or without notice.",
  entry_by_appointment: "Visits only by appointment agreed with the tenant.",
  // padron
  padron_forbidden: "Registering at the address (empadronamiento) is forbidden.",
  // payment_method
  cash_only: "Rent must be paid in cash.",
  bank_transfer: "Rent is paid by bank transfer or another electronic method.",
  // deposit_return
  deposit_no_interest: "The deposit earns no interest when returned late.",
  deposit_forfeit: "The landlord keeps the deposit in some situation other than real damage or debts.",
  return_after_deductions: "The deposit is returned at the end minus real damage or unpaid amounts.",
  // extra_guarantee
  bank_guarantee: "The guarantee is a bank guarantee (aval bancario).",
  third_party_guarantor: "A third person guarantees the contract without a maximum amount.",
  // agency_fee
  landlord_pays_fees: "Agency and contract-preparation fees are paid by the landlord.",
  optional_service: "The charged service is described as optional and requested by the tenant.",
  // purchase_right
  waives_preferential_purchase: "The tenant waives the preferential purchase rights (tanteo y retracto).",
  // default_insurance
  mandatory_default_insurance: "The tenant must take out rent-default insurance.",
  // temporal_cause
  seasonal_label: "The contract is labelled seasonal or temporary (por temporada / temporal).",
  excludes_habitual_residence: "The contract excludes the rules for a permanent home.",
  successive_renewals: "The contract can be renewed in successive short periods.",
  // utilities / pets / sublet / works
  utilities_by_meter: "Water, electricity and gas with individual meters are paid by the tenant.",
  pets_forbidden: "Pets are forbidden or need the landlord's permission.",
  sublet_needs_permission: "Subletting or assignment needs the landlord's written consent.",
  works_need_permission: "Works need the landlord's written consent.",
} as const;

export type Topic = (typeof TOPICS)[number];
export type Signal = keyof typeof SIGNALS;

const signalKeys = Object.keys(SIGNALS) as [Signal, ...Signal[]];

const numbersSchema = z.object({
  months: z.number().nullable().describe("A number of months the clause mentions (rent months, guarantee months, months in advance)."),
  amount_eur: z.number().nullable().describe("A euro amount the clause mentions, as a plain number."),
  percent: z.number().nullable().describe("A percentage the clause mentions (e.g. 3 for 'three points')."),
  days: z.number().nullable().describe("A number of days the clause mentions (notice, deadline)."),
  every_months: z.number().nullable().describe("How often something happens, in months (e.g. 6 for 'every six months')."),
  annual_amount_eur: z.number().nullable().describe("A yearly euro amount the clause states."),
});

export const clauseSchema = z.object({
  clause_ref: z.string().describe("The clause heading as written, e.g. 'QUINTA' or 'TÍTULO'."),
  quote: z
    .string()
    .describe("One continuous passage copied character for character from the contract. No ellipses, no paraphrase."),
  topic: z.enum(TOPICS),
  numbers: numbersSchema,
  payer: z.enum(["tenant", "landlord", "unclear"]),
  signals: z.array(z.enum(signalKeys)),
});

export const factsSchema = z.object({
  signing_date: z.string().nullable().describe("ISO date yyyy-mm-dd when the contract was signed, or null if not stated."),
  monthly_rent_eur: z.number().nullable(),
  duration_months: z.number().nullable(),
  landlord_type: z.enum(["natural_person", "legal_person", "unknown"]),
  contract_kind: z.enum(["habitual", "temporada", "temporal", "room", "unknown"]),
  temporal_cause: z.string().nullable().describe("The concrete reason for a temporary stay if the contract states one, else null."),
  agency_involved: z.boolean(),
  agency_name: z.string().nullable(),
  city: z.string().nullable(),
  is_rental_contract: z.boolean().describe("False if the text is not a residential rental contract."),
  language: z.enum(["es", "other"]).describe("'es' if the contract text is in Spanish."),
});

export const extractionSchema = z.object({
  facts: factsSchema,
  clauses: z.array(clauseSchema),
});

export type ContractFacts = z.infer<typeof factsSchema>;
export type Clause = z.infer<typeof clauseSchema>;
export type ClauseNumbers = z.infer<typeof numbersSchema>;
export type Extraction = z.infer<typeof extractionSchema>;

export type SampleProvenance = {
  kind: "recorded" | "hand-made";
  model?: string;
  recordedAt?: string;
};

export type SampleFile = {
  id: string;
  title: string;
  text: string;
  extraction: Extraction;
  provenance: SampleProvenance;
};
