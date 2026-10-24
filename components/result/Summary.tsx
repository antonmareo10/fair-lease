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

function Counter({ verdict, label, value }: { verdict: Verdict; label: string; value: number }) {
  const n = useCountUp(value);
  return (
    <li className={`v-${verdict} flex items-baseline gap-2`}>
      <span className="font-serif text-[2.4rem] leading-none tabular sm:text-[2.8rem]" aria-hidden="true">
        {n}
      </span>
      <span className="chip">
        <VerdictIcon verdict={verdict} />
        {label}
      </span>
      <span className="sr-only">
        {value} {label}
      </span>
    </li>
  );
}

export function Summary({ counts }: { counts: Record<Verdict, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Summary">
      {ORDER.filter((o) => o.verdict !== "INFO" || counts.INFO > 0).map((o) => (
        <Counter key={o.verdict} verdict={o.verdict} label={o.label} value={counts[o.verdict]} />
      ))}
    </ul>
  );
}
