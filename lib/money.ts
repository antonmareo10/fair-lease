import type { AnalysisResult } from "@/lib/analyze";
import { amountOf } from "@/lib/rules/helpers";

export type MoneyLine = {
  committed: number;
  cash: number;
  guarantees: number;
  legalMax: number;
  over: number;
  guaranteeKind: "bank guarantee" | "guarantees" | null;
};


/**
 * Money Calculator (spec.md > Money Calculator, prd.md > Money Line).
 * Only uses numbers written in the contract's own verified clauses; returns null
 * when they aren't there or nothing is above the legal maximum.
 */
export function computeMoney(result: AnalysisResult): MoneyLine | null {
  const rent = result.facts.monthly_rent_eur;
  if (!rent || result.law.regime === "pre2019") return null;
  const verified = result.clauses.map((clause, i) => ({ clause, i })).filter(({ i }) => result.spans[i] !== null);
  const sum = (topic: string, filter: (c: (typeof verified)[number]["clause"]) => boolean = () => true) =>
    verified.filter(({ clause }) => clause.topic === topic && filter(clause)).reduce((s, { clause }) => s + (amountOf(clause, rent) ?? 0), 0);

  const prepayment = sum("prepayment");
  const deposit = sum("deposit");
  const agency = sum("agency_fee", (c) => c.payer === "tenant" && !c.signals.includes("landlord_pays_fees"));
  const guaranteeClauses = verified.filter(({ clause }) => clause.topic === "extra_guarantee");
  const guarantees = sum("extra_guarantee");

  if (prepayment === 0 && deposit === 0 && guarantees === 0 && agency === 0) return null;

  const cash = (prepayment || rent) + deposit + agency;
  const committed = cash + guarantees;

  const validTemporary = result.law.regime === "C" && result.facts.contract_kind === "temporal" && !!result.facts.temporal_cause;
  const guaranteeCap = (validTemporary ? 1 : 2) * rent;
  const agencyAllowed = result.law.regime === "A" && result.facts.landlord_type === "natural_person" ? agency : 0;
  const legalMax = rent + rent + guaranteeCap + agencyAllowed;
  const over = committed - legalMax;
  if (over < 0.5) return null;

  const bank = guaranteeClauses.some(({ clause }) => clause.signals.includes("bank_guarantee"));
  return {
    committed,
    cash,
    guarantees,
    legalMax,
    over,
    guaranteeKind: guarantees > 0 ? (bank ? "bank guarantee" : "guarantees") : null,
  };
}
