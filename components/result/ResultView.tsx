"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/analyze";
import { buildSegments } from "@/lib/segments";
import { Sheet } from "./Sheet";
import { Summary } from "./Summary";

type Props = {
  text: string;
  result: AnalysisResult;
  label: string;
  onBack: () => void;
};

export function ResultView({ text, result, label, onBack }: Props) {
  const segments = useMemo(() => buildSegments(text, result.spans, result.findings), [text, result]);
  const [active, setActive] = useState<number[]>([]);
  const [pulseKey, setPulseKey] = useState(0);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={onBack} className="rounded-md text-[0.9rem] font-medium text-ink-2 hover:text-ink">
          ← Check another contract
        </button>
        <span className="rounded-full border border-[var(--hairline)] px-3 py-1 text-[0.78rem] text-ink-2">{label}</span>
      </div>

      <section aria-label="Result summary" className="mb-8 grid gap-4">
        <Summary counts={result.counts} />
        <p className="text-[0.95rem] text-ink-2">{result.law.sentence}</p>
      </section>

      <div className="max-w-[820px]">
        <Sheet
          text={text}
          segments={segments}
          activeClauses={active}
          pulseKey={pulseKey}
          onOpen={(i) => {
            setActive([i]);
            setPulseKey((k) => k + 1);
          }}
        />
      </div>
    </main>
  );
}
