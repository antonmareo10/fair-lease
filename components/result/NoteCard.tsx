"use client";

import { forwardRef } from "react";
import type { NoteGroup } from "@/lib/groups";
import { FindingNote, type Lang } from "./FindingNote";

type Props = {
  group: NoteGroup;
  active: boolean;
  /** Inside an open group, only this finding shows its details (others stay compact). */
  openFindingId?: string | null;
  onOpenFinding?: (id: string) => void;
  lang: Lang;
  onLang: (l: Lang) => void;
  onCopy: (text: string) => void;
  onOpen: () => void;
  style?: React.CSSProperties;
};

/** A margin note for one clause: its findings stacked by severity. Click to open the details. */
export const NoteCard = forwardRef<HTMLDivElement, Props>(function NoteCard({ group, active, openFindingId, onOpenFinding, lang, onLang, onCopy, onOpen, style }, ref) {
  const n = group.findings.length;
  return (
    <div
      ref={ref}
      style={style}
      data-group={group.key}
      data-active={active}
      className={`v-${group.top} rounded-[3px] border border-[var(--hairline)] bg-paper shadow-[0_1px_0_rgba(29,27,24,0.04)] transition-[box-shadow,transform] duration-300 ease-[var(--ease)] data-[active=true]:shadow-[var(--shadow-sheet)]`}
    >
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-[3px] bg-[var(--chip)]" aria-hidden="true" />
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={active}
        className="flex w-full items-center justify-between gap-2 px-4 pb-1 pt-3 text-left"
      >
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
          {group.clauseRef ? `Clause ${group.clauseRef.toLowerCase()}` : "The whole contract"}
          {n > 1 ? ` · ${n} findings` : ""}
        </span>
        <span className="text-[0.75rem] text-ink-2" aria-hidden="true">
          {active ? "−" : "+"}
        </span>
      </button>
      <div className="grid gap-4 px-4 pb-4 pt-1">
        {group.findings.map((f, i) => {
          const expanded = active && (openFindingId === undefined || openFindingId === f.id);
          return (
            <div
              key={f.id}
              className={`${i > 0 ? "border-t border-[var(--hairline)] pt-3" : ""} ${expanded ? "" : "cursor-pointer"}`}
              onClick={expanded ? undefined : active ? () => onOpenFinding?.(f.id) : onOpen}
            >
              <FindingNote finding={f} expanded={expanded} lang={lang} onLang={onLang} onCopy={onCopy} />
              {active && !expanded ? <p className="mt-1 text-[0.78rem] font-medium text-ink-2 underline underline-offset-4">Open this one</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
});
