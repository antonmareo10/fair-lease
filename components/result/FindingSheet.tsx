"use client";

import { useEffect, useRef } from "react";
import type { NoteGroup } from "@/lib/groups";
import { FindingNote, type Lang } from "./FindingNote";

type Props = {
  group: NoteGroup | null;
  lang: Lang;
  onLang: (l: Lang) => void;
  onCopy: (text: string) => void;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
};

/** Phone layout: a bottom sheet over the annotated text (prd.md > Screens and Layout). */
export function FindingSheet({ group, lang, onLang, onCopy, onClose, onStep }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (group && !d.open) d.showModal();
    if (!group && d.open) d.close();
  }, [group]);

  return (
    <dialog
      ref={ref}
      aria-label={group?.clauseRef ? `Findings for clause ${group.clauseRef.toLowerCase()}` : "Findings"}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="finding-sheet m-0 mt-auto max-h-[78dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border-t border-[var(--hairline)] bg-paper p-0 text-ink shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)]"
    >
      {group ? (
        <div className={`v-${group.top} grid gap-4 px-5 pb-8 pt-3`}>
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--rule)]" aria-hidden="true" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
              {group.clauseRef ? `Clause ${group.clauseRef.toLowerCase()}` : "The whole contract"}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onStep(-1)} className="rounded-full px-2.5 py-1 text-[0.8rem] text-ink-2" aria-label="Previous finding">
                ↑
              </button>
              <button type="button" onClick={() => onStep(1)} className="rounded-full px-2.5 py-1 text-[0.8rem] text-ink-2" aria-label="Next finding">
                ↓
              </button>
              <button type="button" onClick={onClose} className="rounded-full border border-[var(--hairline)] px-3 py-1 text-[0.8rem] font-medium">
                Close
              </button>
            </div>
          </div>
          {group.findings.map((f, i) => (
            <div key={f.id} className={i > 0 ? "border-t border-[var(--hairline)] pt-4" : ""}>
              <FindingNote finding={f} expanded lang={lang} onLang={onLang} onCopy={onCopy} />
            </div>
          ))}
        </div>
      ) : null}
    </dialog>
  );
}
