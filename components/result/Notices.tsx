import type { AnalysisResult } from "@/lib/analyze";
import { DISCLAIMER } from "@/lib/rules/texts";
import { VerdictIcon } from "@/components/VerdictChip";

/** Edge cases and fixed notices (prd.md > Notices, prd.md > States and Boundaries). */
export function Notices({ result }: { result: AnalysisResult }) {
  const lines: string[] = [];
  if (result.law.regime === "pre2019") lines.push("This contract is from before March 2019. The rules may be different, so Fair Lease doesn't check it.");
  if (result.law.window1to2Oct2026) lines.push("Signed during a two-day legal window (1–2 Oct 2026), when a reform later repealed was in force. Check with a professional.");
  if (result.hiddenCount > 0)
    lines.push(
      `${result.hiddenCount} ${result.hiddenCount === 1 ? "suggestion" : "suggestions"} hidden because we couldn't find the exact words in your contract.`,
    );
  if (result.notInMadrid) lines.push("These rules are national, but Madrid-specific notes (no rent-cap zones) may not apply to your city.");
  if (result.law.pendingVote)
    lines.push("Rules checked against the BOE consolidated text of 7 Oct 2026. The 8 Oct 2026 changes still need a vote in Congress.");

  return lines.length ? (
    <ul className="grid gap-1.5" aria-label="Notices">
      {lines.map((l) => (
        <li key={l} className="v-CHECK flex gap-2 text-[0.88rem] leading-snug">
          <span className="mt-0.5 text-[var(--chip)]">
            <VerdictIcon verdict="CHECK" size={13} />
          </span>
          <span>{l}</span>
        </li>
      ))}
    </ul>
  ) : null;
}

export function CleanState({ ruleCount }: { ruleCount: number }) {
  return (
    <p className="v-OK flex items-center gap-2 rounded-[3px] bg-[var(--hl)] px-4 py-3 text-[1rem] font-semibold">
      <span className="text-[var(--chip)]">
        <VerdictIcon verdict="OK" size={18} />
      </span>
      No problems found in the {ruleCount} rules we check.
    </p>
  );
}

export function Disclaimer() {
  return <p className="max-w-[52rem] text-[0.8rem] leading-relaxed text-ink-2">{DISCLAIMER}</p>;
}
