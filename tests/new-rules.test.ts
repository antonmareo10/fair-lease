import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/analyze";
import { anonymize } from "@/lib/anonymize";
import type { Clause, ContractFacts, Extraction, Signal, Topic } from "@/lib/extraction";
import { RULE_COUNT } from "@/lib/rules";

/**
 * The rules added after the held-out evaluation (FL-12, FL-20, FL-21, FL-22, and the FL-03 / FL-07 gaps), run on the
 * held-out contracts' own clauses with hand-made extractions. The verdicts must match eval/holdout/gold.json, which
 * was written before any of these rules existed.
 */
const TODAY = "2026-10-24";
const text = (id: string) => anonymize(readFileSync(`eval/holdout/${id}.txt`, "utf8")).text;
const NONE = { months: null, amount_eur: null, percent: null, days: null, every_months: null, annual_amount_eur: null };

const FACTS: Record<string, ContractFacts> = {
  "ho-2021-company": fact("2021-09-14", 1200, 12, "legal_person"),
  "ho-2025-consumo": fact("2025-04-07", 1050, 12, "natural_person"),
  "ho-2026-temporal": { ...fact("2026-10-20", 950, 10, "legal_person"), contract_kind: "temporal", temporal_cause: "Máster en Salud Pública, UCM, 2026-27" },
  "ho-2026-company": fact("2026-10-15", 1600, 36, "legal_person"),
};

function fact(signing_date: string, rent: number, duration: number, landlord_type: ContractFacts["landlord_type"]): ContractFacts {
  return {
    signing_date,
    monthly_rent_eur: rent,
    duration_months: duration,
    landlord_type,
    contract_kind: "habitual",
    temporal_cause: null,
    agency_involved: false,
    agency_name: null,
    city: "Madrid",
    is_rental_contract: true,
    language: "es",
  };
}

function clause(clause_ref: string, topic: Topic, quote: string, signals: Signal[], numbers: Partial<Clause["numbers"]> = {}): Clause {
  return { clause_ref, topic, quote, payer: "tenant", signals, numbers: { ...NONE, ...numbers } };
}

function run(id: string, clauses: Clause[], facts: Partial<ContractFacts> = {}) {
  const extraction: Extraction = { facts: { ...FACTS[id], ...facts }, clauses };
  const r = analyze(text(id), extraction, { today: TODAY });
  expect(r.hiddenCount).toBe(0);
  // Findings on the given clauses only (a valid temporary contract also gets a contract-level FL-19 "fine").
  return r.findings.filter((f) => f.verdict !== "INFO" && f.clauseIndices.length > 0).map((f) => `${f.ruleId} ${f.verdict}`);
}

describe("rules added after the held-out evaluation", () => {
  it("there are now 22 FL rules", () => {
    expect(RULE_COUNT).toBe(22);
  });

  it("FL-12: a sale ending the lease is not enforceable, with seven years for a company landlord", () => {
    const quote = "en caso de que LA ARRENDADORA venda la vivienda, el presente contrato quedará extinguido";
    expect(run("ho-2021-company", [clause("OCTAVA", "sale", quote, ["sale_ends_lease"])])).toEqual(["FL-12 ILLEGAL"]);
    const r = analyze(text("ho-2021-company"), { facts: FACTS["ho-2021-company"], clauses: [clause("OCTAVA", "sale", quote, ["sale_ends_lease"])] }, { today: TODAY });
    expect(r.findings[0].body).toContain("first 7 years");
    expect(r.findings[0].law.article).toBe("LAU art. 14");
  });

  it("FL-20: three times the daily rent per day of delay is not enforceable with a company, worth checking with a private landlord", () => {
    const h1 = "Por cada día de retraso en el desalojo, LA ARRENDATARIA abonará a LA ARRENDADORA, en concepto de cláusula penal, una cantidad equivalente al triple de la renta diaria vigente";
    expect(run("ho-2021-company", [clause("NOVENA", "late_handover_penalty", h1, ["penalty_three_times_daily_rent"])])).toEqual(["FL-20 ILLEGAL"]);
    const h3 = "abonará a LA ARRENDADORA, por cada día de retraso, una cantidad equivalente al triple de la renta diaria que estuviera vigente";
    expect(run("ho-2025-consumo", [clause("OCTAVA", "late_handover_penalty", h3, ["penalty_three_times_daily_rent"])])).toEqual(["FL-20 CHECK"]);
  });

  it("FL-20: a penalty given in euros is compared with the daily rent, and a proportionate one is left alone", () => {
    const h3 = "abonará a LA ARRENDADORA, por cada día de retraso, una cantidad equivalente al triple de la renta diaria que estuviera vigente";
    // 1,050 € a month is 35 € a day: 105 € is three times it, 35 € is not disproportionate.
    expect(run("ho-2025-consumo", [clause("OCTAVA", "late_handover_penalty", h3, [], { amount_eur: 105 })])).toEqual(["FL-20 CHECK"]);
    expect(run("ho-2025-consumo", [clause("OCTAVA", "late_handover_penalty", h3, [], { amount_eur: 35 })])).toEqual([]);
  });

  it("FL-21 and FL-22: the negotiation boilerplate and all legal costs on the tenant are worth checking with a private landlord", () => {
    const negotiated = "Ambas partes declaran expresamente que el presente contrato, y cada una de sus cláusulas, ha sido objeto de negociación individual entre ellas";
    const costs = "Serán de cuenta de EL ARRENDATARIO todos los gastos judiciales y extrajudiciales, incluidos los honorarios de abogado y procurador";
    const clauses = [
      clause("NOVENA", "legal_costs", costs, ["all_legal_costs_tenant"]),
      clause("DUODÉCIMA", "negotiated_boilerplate", negotiated, ["declares_individual_negotiation"]),
    ];
    expect(run("ho-2025-consumo", clauses)).toEqual(["FL-22 CHECK", "FL-21 CHECK"]);
    expect(run("ho-2025-consumo", clauses, { landlord_type: "legal_person" })).toEqual(["FL-22 ILLEGAL", "FL-21 CHECK"]);
  });

  it("FL-03: a renewal fee is caught whatever topic it was given, since the October 2026 reform", () => {
    const quote = "En cada prórroga anual del contrato, LA PARTE ARRENDATARIA abonará a LA ARRENDADORA la cantidad de 200 € en concepto de gastos de gestión de la renovación";
    expect(run("ho-2026-company", [clause("SÉPTIMA", "other", quote, ["contract_fee"], { amount_eur: 200 })])).toEqual(["FL-03 ILLEGAL"]);
  });

  it("FL-03: an optional service the tenant asked for is worth checking since October 2026, and not a fee rule before", () => {
    const quote = "A solicitud expresa y por escrito de LA ARRENDATARIA, que ha sido informada previamente de su carácter opcional y de su coste";
    expect(run("ho-2026-temporal", [clause("SEXTA", "other", quote, ["optional_service"], { amount_eur: 60 })])).toEqual(["FL-03 CHECK"]);
    expect(run("ho-2026-temporal", [clause("SEXTA", "other", quote, ["optional_service"], { amount_eur: 60 })], { signing_date: "2025-10-20" })).toEqual([]);
  });

  it("FL-07: a twelve-month lock-in is not enforceable; one month in a valid temporary contract is fine", () => {
    const lock = "LA PARTE ARRENDATARIA no podrá desistir del contrato durante los doce primeros meses de vigencia";
    expect(run("ho-2026-company", [clause("OCTAVA", "early_exit", lock, ["no_exit_period"], { months: 12 })])).toEqual(["FL-07 ILLEGAL"]);
    const month = "LA ARRENDATARIA podrá desistir del contrato una vez transcurrido un mes desde su inicio";
    expect(run("ho-2026-temporal", [clause("OCTAVA", "early_exit", month, ["no_exit_period"], { months: 1 })])).toEqual(["FL-07 OK"]);
    // The same one-month wait asked of a permanent home is within the six months the law allows.
    expect(run("ho-2026-company", [clause("OCTAVA", "early_exit", lock, ["no_exit_period"], { months: 6 })])).toEqual(["FL-07 OK"]);
  });
});
