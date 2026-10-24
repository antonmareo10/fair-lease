"use client";

import { useEffect, useState } from "react";
import type { Verdict } from "@/lib/rules/types";
import { VerdictIcon } from "@/components/VerdictChip";

const ORDER: { verdict: Verdict; label: string }[] = [
  { verdict: "ILLEGAL", label: "not enforceable" },
  { verdict: "CHECK", label: "worth checking" },
  { verdict: "OK", label: "fine" },
  { verdict: "INFO", label: "your rights" },
];

function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function Counter({ verdict, label, value, onJump }: { verdict: Verdict; label: string; value: number; onJump?: (verdict: Verdict) => void }) {
  const n = useCountUp(value);
  const inner = (
    <>
      <span className="font-serif text-[2.1rem] leading-none tabular sm:text-[2.8rem]" aria-hidden="true">
        {n}
      </span>
      <span className={`chip ${onJump ? "underline decoration-current/30 underline-offset-4 group-hover:decoration-current" : ""}`}>
        <VerdictIcon verdict={verdict} />
        {label}
      </span>
      <span className="sr-only">
        {value} {label}
        {onJump ? ", show the first one" : ""}
      </span>
    </>
  );
  // A counter with findings behind it jumps to the first of them: the highlights start far down the sheet.
  return (
    <li className={`v-${verdict}`}>
      {onJump ? (
        <button type="button" onClick={() => onJump(verdict)} title="Show the first one" className="group flex cursor-pointer items-baseline gap-2 rounded-md">
          {inner}
        </button>
      ) : (
        <span className="flex items-baseline gap-2">{inner}</span>
      )}
    </li>
  );
}

export function Summary({ counts, onJump }: { counts: Record<Verdict, number>; onJump?: (verdict: Verdict) => void }) {
  return (
    <ul className="flex flex-wrap gap-x-7 gap-y-2 sm:gap-x-8 sm:gap-y-3" aria-label="Summary">
      {ORDER.filter((o) => o.verdict !== "INFO" || counts.INFO > 0).map((o) => (
        <Counter key={o.verdict} verdict={o.verdict} label={o.label} value={counts[o.verdict]} onJump={counts[o.verdict] > 0 ? onJump : undefined} />
      ))}
    </ul>
  );
}
