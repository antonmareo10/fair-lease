"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Segment } from "@/lib/segments";
import { VERDICT_LABEL } from "@/lib/rules/types";

type Props = {
  text: string;
  segments: Segment[];
  activeClauses: number[];
  pulseKey: number;
  onOpen: (clauseIndex: number) => void;
};

/** The contract as a paper sheet, highlighted where a verified quote has findings. */
export function Sheet({ text, segments, activeClauses, pulseKey, onOpen }: Props) {
  const [painted, setPainted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPainted(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Order of first appearance of each highlighted clause → paint stagger.
  const order = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of segments) for (const c of s.clauses) if (!m.has(c)) m.set(c, m.size);
    return m;
  }, [segments]);

  // Pulse the active highlight once when a note is opened.
  useEffect(() => {
    if (!pulseKey || !ref.current || activeClauses.length === 0) return;
    const el = ref.current.querySelector<HTMLElement>(`[data-clause~="${activeClauses[0]}"]`);
    if (!el) return;
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  }, [pulseKey, activeClauses]);

  return (
    <div ref={ref} className={`sheet px-5 py-8 sm:px-14 sm:py-14 ${painted ? "painted" : ""}`} lang="es">
      {segments.map((s) => {
        const piece = text.slice(s.start, s.end);
        if (!s.top) {
          if (s.title) return <span key={s.start} className="title">{piece}</span>;
          if (s.heading) return <span key={s.start} className="heading">{piece}</span>;
          return <span key={s.start}>{piece}</span>;
        }
        const clause = s.clauses[0];
        const active = s.clauses.some((c) => activeClauses.includes(c));
        const delay = (order.get(clause) ?? 0) * 80;
        const isLastPiece = !segments.some((o) => o.start === s.end && o.clauses.join() === s.clauses.join());
        const label = s.findings.map((f) => `${VERDICT_LABEL[f.verdict]}: ${f.title}`).join("; ");
        return (
          <mark
            key={s.start}
            className={`hl v-${s.top}`}
            data-clause={s.clauses.join(" ")}
            data-active={active}
            style={{ "--delay": `${delay}ms` } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={`${label}. Open`}
            onClick={() => onOpen(clause)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(clause);
              }
            }}
          >
            {piece}
            {isLastPiece && s.findings.length > 1 ? (
              <span className="hl-count" aria-hidden="true">
                {s.findings.length}
              </span>
            ) : null}
          </mark>
        );
      })}
    </div>
  );
}
