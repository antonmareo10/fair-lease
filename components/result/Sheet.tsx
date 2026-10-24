"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Segment } from "@/lib/segments";
import { findFold, splitAtFold } from "@/lib/fold";
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

  // The opening (title, parties, background) has nothing marked: fold it so the first highlight starts high on the page.
  const parts = useMemo(() => {
    const fold = findFold(text, segments);
    return fold ? { fold, ...splitAtFold(text, segments, fold) } : null;
  }, [text, segments]);

  const piece = (s: Segment) => {
    const part = text.slice(s.start, s.end);
    if (!s.top) {
      if (s.title) return <span key={s.start} className="title">{part}</span>;
      if (s.heading) return <span key={s.start} className="heading">{part}</span>;
      return <span key={s.start}>{part}</span>;
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
        {part}
        {isLastPiece && s.findings.length > 1 ? (
          <span className="hl-count" aria-hidden="true">
            {s.findings.length}
          </span>
        ) : null}
      </mark>
    );
  };

  return (
    <div ref={ref} className={`sheet px-5 py-8 sm:px-14 sm:py-14 ${painted ? "painted" : ""}`} lang="es">
      {parts ? (
        <>
          {parts.head.map(piece)}
          <details className="fold">
            <summary>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="fold-chevron">
                <path d="M4 2.5 8 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="fold-show">
                Show the opening · {parts.fold.paragraphs} paragraphs<span className="fold-note"> with nothing marked</span>
              </span>
              <span className="fold-hide">Hide the opening</span>
            </summary>
            <div className="fold-body">{parts.folded.map(piece)}</div>
          </details>
          {parts.tail.map(piece)}
        </>
      ) : (
        segments.map(piece)
      )}
    </div>
  );
}
