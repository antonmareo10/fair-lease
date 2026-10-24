"use client";

import { useState } from "react";
import type { Clause } from "@/lib/extraction";
import type { Finding } from "@/lib/rules/types";
import { buildLetter } from "@/lib/letter";
import { LangSwitch, type Lang } from "./FindingNote";

type Props = {
  findings: Finding[];
  clauses: Clause[];
  lang: Lang;
  onLang: (l: Lang) => void;
  onCopy: (text: string) => void;
};

/** "Write to my landlord": the not-enforceable findings as a ready-to-send message (prd.md > Write to My Landlord). */
export function LetterPanel({ findings, clauses, lang, onLang, onCopy }: Props) {
  const [open, setOpen] = useState(false);
  const letter = buildLetter(findings, clauses, lang);
  if (!letter) return null;
  const count = findings.filter((f) => f.verdict === "ILLEGAL").length;

  return (
    <div className="grid gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="letter"
        onClick={() => setOpen((o) => !o)}
        className="w-fit rounded-full bg-[var(--ink)] px-5 py-2.5 text-[0.95rem] font-semibold text-[var(--paper)] transition-transform active:scale-[0.98]"
      >
        {open ? "Hide the message" : "Write to my landlord"}
      </button>
      {open ? (
        <section id="letter" aria-label="Message to your landlord" className="sheet grid max-w-[46rem] gap-3 px-5 py-5 sm:px-7" style={{ whiteSpace: "normal" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-sans text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-ink-2">
              {count} {count === 1 ? "change" : "changes"} to ask for · {lang === "es" ? "Spanish, to send" : "English, so you know what it says"}
            </p>
            <LangSwitch lang={lang} onLang={onLang} />
          </div>
          <pre lang={lang} className="whitespace-pre-wrap font-serif text-[1rem] leading-relaxed">
            {letter}
          </pre>
          <p className="font-sans text-[0.8rem] text-ink-2">Built from Fair Lease&apos;s fixed rule texts, not written by AI. Add your name before sending.</p>
          <button
            type="button"
            onClick={() => onCopy(letter)}
            className="w-fit rounded-full bg-[var(--ink)] px-4 py-2 font-sans text-[0.85rem] font-semibold text-[var(--paper)] transition-transform active:scale-[0.97]"
          >
            Copy the message
          </button>
        </section>
      ) : null}
    </div>
  );
}
