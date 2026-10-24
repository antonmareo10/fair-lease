"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/analyze";
import type { Verdict } from "@/lib/rules/types";
import { buildSegments } from "@/lib/segments";
import { buildGroups, groupForClause } from "@/lib/groups";
import { computeMoney } from "@/lib/money";
import { Sheet } from "./Sheet";
import { Summary } from "./Summary";
import { MoneyLine } from "./MoneyLine";
import { MarginNotes } from "./MarginNotes";
import { FindingSheet } from "./FindingSheet";
import { NoteCard } from "./NoteCard";
import type { Lang } from "./FindingNote";
import { Timeline } from "./Timeline";
import { LetterPanel } from "./LetterPanel";
import { CleanState, Disclaimer, Notices } from "./Notices";

type Props = {
  text: string;
  result: AnalysisResult;
  label: string;
  onBack: () => void;
  onDate?: (iso: string) => void;
  removed?: string;
};

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function ResultView({ text, result, label, onBack, onDate, removed }: Props) {
  const segments = useMemo(() => buildSegments(text, result.spans, result.findings), [text, result]);
  const groups = useMemo(() => buildGroups(result.findings, result.clauses, result.spans), [result]);
  const money = useMemo(() => computeMoney(result), [result]);
  const desktop = useIsDesktop();

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [openFindingId, setOpenFindingId] = useState<string | null>(null);
  const [sheetKey, setSheetKey] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [lang, setLang] = useState<Lang>("es");
  const [toast, setToast] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<Record<string, number>>({});
  const sheetWrap = useRef<HTMLDivElement>(null);

  const activeGroup = groups.find((g) => g.key === (desktop ? activeKey : sheetKey)) ?? null;

  // Measure where each group's first highlight sits, for the margin layout.
  useLayoutEffect(() => {
    const wrap = sheetWrap.current;
    if (!wrap) return;
    const measure = () => {
      const base = wrap.getBoundingClientRect().top;
      const next: Record<string, number> = {};
      for (const g of groups) {
        let top = Number.POSITIVE_INFINITY;
        for (const i of g.clauseIndices) {
          const el = wrap.querySelector<HTMLElement>(`[data-clause~="${i}"]`);
          if (el) top = Math.min(top, el.getBoundingClientRect().top - base);
        }
        next[g.key] = Number.isFinite(top) ? top : 0;
      }
      setAnchors((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [groups]);

  const scrollToGroup = useCallback(
    (key: string) => {
      const g = groups.find((x) => x.key === key);
      const wrap = sheetWrap.current;
      if (!g || !wrap) return;
      const el = g.clauseIndices.map((i) => wrap.querySelector<HTMLElement>(`[data-clause~="${i}"]`)).find(Boolean);
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
      setPulseKey((k) => k + 1);
    },
    [groups],
  );

  const open = useCallback(
    (key: string, scroll: boolean) => {
      if (desktop) {
        setActiveKey(key);
        setOpenFindingId(groups.find((g) => g.key === key)?.findings[0]?.id ?? null);
        if (scroll) scrollToGroup(key);
        else setPulseKey((k) => k + 1);
      } else {
        setSheetKey(key);
        setPulseKey((k) => k + 1);
      }
    },
    [desktop, scrollToGroup, groups],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const anchored = groups.filter((g) => g.clauseRef);
      if (anchored.length === 0) return;
      const current = desktop ? activeKey : sheetKey;
      const idx = anchored.findIndex((g) => g.key === current);
      const next = anchored[(idx + dir + anchored.length) % anchored.length] ?? anchored[0];
      if (desktop) open(next.key, true);
      else {
        setSheetKey(next.key);
        scrollToGroup(next.key);
      }
    },
    [groups, desktop, activeKey, sheetKey, open, scrollToGroup],
  );

  const jumpTo = useCallback(
    (verdict: Verdict) => {
      const g = groups.find((x) => x.clauseRef && x.findings.some((f) => f.verdict === verdict));
      if (!g) return;
      if (desktop) open(g.key, true);
      else {
        setSheetKey(g.key);
        scrollToGroup(g.key);
      }
    },
    [groups, desktop, open, scrollToGroup],
  );

  // J/K move between findings; Escape closes (prd.md > Findings and Verdicts).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        step(1);
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Escape" && desktop) {
        setActiveKey(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, desktop]);

  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Copied");
    } catch {
      setToast("Couldn't copy. Select the text and copy it by hand.");
    }
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const contractGroups = groups.filter((g) => !g.clauseRef);
  // On a phone the numbers and the first highlight share the first screen, so the timeline's track goes below the sheet.
  // With an assumed date the date picker matters for the result, so that timeline stays up top, whole.
  const trackBelow = !desktop && !result.law.assumedToday;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mb-6">
        <button type="button" onClick={onBack} className="rounded-md text-[0.9rem] font-medium text-ink-2 hover:text-ink">
          ← Check another contract
        </button>
        <span className="rounded-full border border-[var(--hairline)] px-3 py-1 text-[0.78rem] text-ink-2">{label}</span>
        <p className="ml-auto hidden text-[0.8rem] text-ink-2 lg:block">
          Click a number, a highlight or a note to open it · <kbd className="font-sans">J</kbd>/<kbd className="font-sans">K</kbd> to move between findings
        </p>
      </div>

      {/* Same two columns as the sheet below: the numbers and the euros on the left, the law timeline in the margin. */}
      <section aria-label="Result summary" className="mb-6 grid items-end gap-x-10 gap-y-4 sm:mb-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-4">
          <Summary counts={result.counts} onJump={jumpTo} />
          {result.counts.ILLEGAL === 0 && result.counts.CHECK === 0 && result.law.regime !== "pre2019" ? <CleanState ruleCount={result.ruleCount} /> : null}
          {money ? <MoneyLine money={money} /> : null}
          <LetterPanel findings={result.findings} clauses={result.clauses} lang={lang} onLang={setLang} onCopy={copy} />
        </div>
        <Timeline law={result.law} onDate={onDate} part={trackBelow ? "sentence" : "all"} />
        <div className="empty:hidden lg:col-span-2">
          <Notices result={result} />
        </div>
      </section>

      {!desktop && contractGroups.length > 0 ? (
        <div className="mb-4 grid gap-3">
          {contractGroups.map((g) => (
            <NoteCard key={g.key} group={g} clauses={result.clauses} active={false} lang={lang} onLang={setLang} onCopy={copy} onOpen={() => open(g.key, false)} style={{ position: "relative" }} />
          ))}
        </div>
      ) : null}

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div ref={sheetWrap} className="min-w-0">
          <Sheet
            text={text}
            segments={segments}
            activeClauses={activeGroup?.clauseIndices ?? []}
            pulseKey={pulseKey}
            onOpen={(i) => {
              const g = groupForClause(groups, i);
              if (g) open(g.key, false);
            }}
          />
        </div>
        {desktop ? (
          <MarginNotes
            groups={groups}
            clauses={result.clauses}
            anchors={anchors}
            activeKey={activeKey}
            openFindingId={openFindingId}
            onOpenFinding={setOpenFindingId}
            lang={lang}
            onLang={setLang}
            onCopy={copy}
            onOpen={(key) => (key === activeKey ? setActiveKey(null) : open(key, true))}
          />
        ) : null}
      </div>

      <div className="mt-10 grid gap-5">
        {trackBelow ? <Timeline law={result.law} part="graphic" /> : null}
        {removed ? <p className="text-[0.85rem] text-ink-2">Removed before analysis: {removed}.</p> : null}
        <p className="text-[0.85rem] text-ink-2 lg:hidden">Tap a number or a highlighted sentence to open it.</p>
        <Disclaimer />
      </div>

      {!desktop ? (
        <FindingSheet group={activeGroup} clauses={result.clauses} lang={lang} onLang={setLang} onCopy={copy} onClose={() => setSheetKey(null)} onStep={step} />
      ) : null}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
        {toast ? <span className="rounded-full bg-[var(--ink)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--paper)] shadow-lg">{toast}</span> : null}
      </div>
    </main>
  );
}
