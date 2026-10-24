"use client";

import { useState } from "react";
import type { SampleFile } from "@/lib/extraction";
import { SAMPLES } from "@/lib/samples";
import { MAX_CHARS } from "@/lib/validate";

type Props = {
  draft: string;
  onDraft: (text: string) => void;
  error: string | null;
  onCheck: (text: string) => void;
  onSample: (sample: SampleFile) => void;
};

const TRUST = [
  { title: "Rules hand-checked against the BOE", body: "Every verdict cites the exact article of Spanish law." },
  { title: "Claude reads, the rules decide", body: "The AI only quotes your contract. Fixed public rules give the verdict." },
  { title: "Your contract is not stored", body: "ID numbers, bank accounts, phones and emails are removed before it's sent." },
];

export function StartScreen({ draft, onDraft, error, onCheck, onSample }: Props) {
  const [focused, setFocused] = useState(false);
  const empty = draft.trim().length === 0;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <section aria-labelledby="hero">
          <p className="mb-5 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-2">Made for people renting a home in Madrid</p>
          <h1 id="hero" className="font-serif text-[2.6rem] leading-[1.04] tracking-[-0.02em] sm:text-[4.1rem]">
            Is your rental contract legal?
          </h1>
          <p className="mt-6 max-w-[34rem] text-[1.08rem] leading-relaxed text-ink-2">
            Paste it. Fair Lease marks every clause Spanish law doesn&apos;t allow, with the exact article and what to ask for instead.
          </p>

          <form
            className="mt-8 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!empty) onCheck(draft);
            }}
          >
            {error ? (
              <p role="alert" className="v-CHECK rounded-[3px] border-l-[3px] border-[var(--chip)] bg-[var(--hl)] px-4 py-3 text-[0.95rem]">
                {error}
              </p>
            ) : null}
            <label htmlFor="contract" className="sr-only">
              Your contract text
            </label>
            <textarea
              id="contract"
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={focused || !empty ? 12 : 6}
              maxLength={MAX_CHARS + 5000}
              spellCheck={false}
              lang="es"
              placeholder="Paste the full text of your contract here, in Spanish…"
              className="sheet w-full resize-y px-5 py-4 text-[0.98rem] leading-relaxed outline-none transition-[height] placeholder:text-ink-2/70 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.82rem] text-ink-2">We remove ID numbers, bank accounts, phone numbers and emails before analysis.</p>
              <a href="#samples" className="text-[0.92rem] font-semibold underline decoration-[var(--hairline)] underline-offset-4 lg:hidden">
                Or try a sample ↓
              </a>
              <button
                type="submit"
                disabled={empty}
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-[0.98rem] font-semibold text-[var(--paper)] transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Check my contract
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="samples" className="scroll-mt-6 lg:pt-3">
          <h2 id="samples" tabIndex={-1} className="mb-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
            No contract to hand? Try a sample
          </h2>
          <ul className="grid gap-3">
            {SAMPLES.map(({ file, blurb }) => (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => onSample(file)}
                  className="group grid w-full gap-1 rounded-[3px] border border-[var(--hairline)] bg-paper px-5 py-4 text-left shadow-[0_1px_0_rgba(29,27,24,0.04)] transition-[transform,box-shadow] duration-300 ease-[var(--ease)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sheet)]"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-serif text-[1.15rem] font-semibold">{file.title}</span>
                    <span aria-hidden="true" className="text-ink-2 transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  <span className="text-[0.86rem] text-ink-2">{blurb}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-2">Samples are fictional contracts. They open instantly and don&apos;t use the AI.</p>
        </section>
      </div>

      <ul className="mt-16 grid gap-6 border-t border-rule pt-8 sm:grid-cols-3">
        {TRUST.map((t) => (
          <li key={t.title}>
            <p className="text-[0.95rem] font-semibold">{t.title}</p>
            <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-2">{t.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
