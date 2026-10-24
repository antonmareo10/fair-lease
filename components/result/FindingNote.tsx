"use client";

import type { Finding } from "@/lib/rules/types";
import { VerdictChip } from "@/components/VerdictChip";

export type Lang = "es" | "en";

type Props = {
  finding: Finding;
  expanded: boolean;
  lang: Lang;
  onLang: (lang: Lang) => void;
  onCopy: (text: string) => void;
};

export function PendingTag() {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--hairline)] px-2 py-0.5 text-[0.68rem] font-medium tracking-wide text-ink-2">
      New since 8 Oct 2026 · pending Congress vote
    </span>
  );
}

/** One finding: chip, plain title, number; expanded with the why, the law and what to ask instead. */
export function FindingNote({ finding: f, expanded, lang, onLang, onCopy }: Props) {
  const ask = f.askInstead;
  return (
    <article className={`v-${f.verdict} grid gap-2`} data-finding={f.id}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <VerdictChip verdict={f.verdict} />
        {f.newSinceOct2026 ? <PendingTag /> : null}
      </div>
      <h3 className="text-[0.98rem] font-semibold leading-snug">{f.title}</h3>
      {f.number ? <p className="tabular text-[0.9rem] font-semibold text-[var(--chip)]">{f.number}</p> : null}

      {expanded ? (
        <div className="grid gap-3 pt-1">
          <p className="text-[0.9rem] leading-relaxed text-ink-2">{f.body}</p>

          <details className="group rounded-[3px] border border-[var(--hairline)] bg-[var(--bg)]/40 px-3 py-2">
            <summary className="cursor-pointer list-none text-[0.84rem] font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="mr-1 inline-block transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
                ›
              </span>
              What the law says · {f.law.article}
            </summary>
            <div className="mt-2 grid gap-2 text-[0.88rem] leading-relaxed">
              {f.law.quoteEs ? (
                <blockquote lang="es" className="border-l-2 border-[var(--chip)] pl-3 font-serif italic">
                  “{f.law.quoteEs}”
                </blockquote>
              ) : null}
              {f.law.quoteEn ? (
                <p className="text-ink-2">
                  <span className="font-medium">Unofficial translation: </span>
                  {f.law.quoteEn}
                </p>
              ) : null}
              <a href={f.law.boeUrl} target="_blank" rel="noopener noreferrer" className="w-fit font-medium underline decoration-[var(--hairline)] underline-offset-4 hover:decoration-current">
                Open in the BOE ↗
              </a>
            </div>
          </details>

          {ask ? (
            <div className="grid gap-2 rounded-[3px] bg-[var(--hl)] px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em]">Ask for this instead</p>
                <LangSwitch lang={lang} onLang={onLang} />
              </div>
              <p lang={lang} className="font-serif text-[1rem] leading-snug">
                {lang === "es" ? ask.es : ask.en}
              </p>
              {lang === "es" ? <p className="text-[0.82rem] leading-snug text-ink-2">In English: {ask.en}</p> : null}
              <button
                type="button"
                onClick={() => onCopy(lang === "es" ? ask.es : ask.en)}
                className="w-fit rounded-full bg-[var(--ink)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[var(--paper)] transition-transform active:scale-[0.97]"
              >
                Copy {lang === "es" ? "in Spanish" : "in English"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function LangSwitch({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-full border border-[var(--hairline)] p-0.5 text-[0.72rem] font-semibold">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onLang(l)}
          className={`rounded-full px-2.5 py-0.5 transition-colors ${lang === l ? "bg-[var(--ink)] text-[var(--paper)]" : "text-ink-2 hover:text-ink"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
