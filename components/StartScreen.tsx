"use client";

import type { SampleFile } from "@/lib/extraction";
import { SAMPLES } from "@/lib/samples";

type Props = {
  onSample: (sample: SampleFile) => void;
};

const TRUST = [
  { title: "Rules hand-checked against the BOE", body: "Every verdict cites the exact article of Spanish law." },
  { title: "Claude reads, the rules decide", body: "The AI only quotes your contract. Fixed public rules give the verdict." },
  { title: "Your contract is not stored", body: "ID numbers, bank accounts, phones and emails are removed first." },
];

export function StartScreen({ onSample }: Props) {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <section aria-labelledby="hero">
          <p className="mb-5 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-2">Made for people renting a home in Madrid</p>
          <h1 id="hero" className="font-serif text-[2.6rem] leading-[1.04] tracking-[-0.02em] sm:text-[4.1rem]">
            Is your rental contract legal?
          </h1>
          <p className="mt-6 max-w-[34rem] text-[1.08rem] leading-relaxed text-ink-2">
            Paste it. Fair Lease marks every clause Spanish law doesn&apos;t allow, with the exact article and what to ask for instead.
          </p>
        </section>

        <section aria-labelledby="samples" className="lg:pt-3">
          <h2 id="samples" className="mb-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
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
