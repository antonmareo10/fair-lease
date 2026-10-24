import type { MoneyLine as Money } from "@/lib/money";
import { eur } from "@/lib/rules/helpers";

/** Only shown when the contract's own numbers support it (prd.md > Money Line). */
export function MoneyLine({ money }: { money: Money }) {
  const what = money.guaranteeKind ? `cash plus a ${money.guaranteeKind}` : "in cash";
  return (
    <p className="max-w-[46rem] text-[1.02rem] leading-relaxed">
      At signing this contract ties up <strong className="tabular font-semibold">{eur(money.committed)}</strong> ({what}). The legal maximum is{" "}
      <strong className="tabular font-semibold">{eur(money.legalMax)}</strong>.{" "}
      <span className="v-ILLEGAL tabular font-semibold text-[var(--chip)]">That&apos;s {eur(money.over)} more than the law allows.</span>
    </p>
  );
}
