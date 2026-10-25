"use client";

import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import type { SampleFile } from "@/lib/extraction";
import { SAMPLES } from "@/lib/samples";
import { MAX_CHARS } from "@/lib/validate";
import { REPO_URL } from "@/lib/site";

/** A PDF whose text is in the box: where it came from, so the screen can say what happened to it. */
export type PdfSource = { name: string; pages: number; scannedPages: number };

type Props = {
  draft: string;
  onDraft: (text: string) => void;
  error: string | null;
  onCheck: (text: string) => void;
  onSample: (sample: SampleFile) => void;
  onPdf: (file: File) => void;
  /** Name of the PDF being read right now, if any. */
  reading: string | null;
  pdf: PdfSource | null;
  onClearPdf: () => void;
  onPreparePdf: () => void;
};

const TRUST: { title: string; body: string; link?: { href: string; label: string } }[] = [
  { title: "Rules hand-checked against the BOE", body: "The BOE is Spain's official gazette. Every verdict cites the exact article of the law." },
  { title: "Claude reads, the rules decide", body: "The AI only quotes your contract. Fixed public rules give the verdict." },
  { title: "Your contract is not stored", body: "A PDF is read on your device. ID numbers, bank accounts, phones and emails are removed before anything is sent." },
  {
    title: "Tested on 125 clauses",
    body: "Nine contracts, every clause given its expected verdict by hand before the app read it, and compared with asking the AI alone.",
    link: { href: `${REPO_URL}/blob/main/eval/README.md`, label: "How it's tested, misses included" },
  },
];

const delay = (ms: number) => ({ "--rise-delay": `${ms}ms` }) as CSSProperties;

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

function DocIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M5 2.75h6.5L15.25 6.5v10.75H5z" />
      <path d="M11.25 2.75V6.75h4" />
      <path d="M7.75 10.25h4.5M7.75 13h4.5" strokeLinecap="round" />
    </svg>
  );
}

export function StartScreen({ draft, onDraft, error, onCheck, onSample, onPdf, reading, pdf, onClearPdf, onPreparePdf }: Props) {
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const empty = draft.trim().length === 0;

  // Once a PDF's text is in the box, bring the Check button into view: the box has grown to show the text.
  useEffect(() => {
    if (pdf) submit.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [pdf]);

  const take = (files: FileList | null | undefined) => {
    const file = files?.[0];
    if (file) onPdf(file);
  };

  // The whole start screen accepts a dropped file, so a near miss doesn't open the PDF in the browser instead.
  const dropHandlers = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      if (depth.current === 1) onPreparePdf();
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      take(e.dataTransfer.files);
    },
  };

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-10 sm:px-8 sm:pt-14" {...dropHandlers}>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <section aria-labelledby="hero">
          <p className="rise mb-5 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-2">Made for people renting a home in Madrid</p>
          <h1 id="hero" className="rise text-balance font-serif text-[2.6rem] leading-[1.04] tracking-[-0.02em] sm:text-[4.1rem]" style={delay(60)}>
            Is your rental contract legal?
          </h1>
          <p className="rise mt-6 max-w-[34rem] text-[1.08rem] leading-relaxed text-ink-2" style={delay(120)}>
            Paste it or upload the PDF. Fair Lease marks every clause Spanish law doesn&apos;t allow, with the exact article and what to ask for instead.
          </p>

          <form
            className="rise mt-8 grid gap-3"
            style={delay(180)}
            onSubmit={(e) => {
              e.preventDefault();
              if (!empty && !reading) onCheck(draft);
            }}
          >
            {error ? (
              <p role="alert" className="v-CHECK rounded-[3px] border-l-[3px] border-[var(--chip)] bg-[var(--hl)] px-4 py-3 text-[0.95rem]">
                {error}
              </p>
            ) : null}
            {pdf && !empty ? (
              <div role="status" className="flex items-start gap-3 rounded-[3px] border border-[var(--hairline)] bg-paper px-4 py-3 text-[0.9rem]">
                <span className="mt-[1px] text-ink-2">
                  <DocIcon />
                </span>
                <p className="min-w-0 flex-1 leading-snug">
                  <span className="block truncate font-semibold" title={pdf.name}>
                    {pdf.name}
                  </span>
                  <span className="text-ink-2">
                    {pdf.pages} {pdf.pages === 1 ? "page" : "pages"} read on your device. Nothing has been sent yet.
                    {pdf.scannedPages > 0
                      ? ` ${pdf.scannedPages} ${pdf.scannedPages === 1 ? "page looks" : "pages look"} scanned (no text) and ${pdf.scannedPages === 1 ? "was" : "were"} skipped.`
                      : ""}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={onClearPdf}
                  className="-my-2 min-h-11 flex-none rounded-full px-2 text-[0.82rem] font-semibold text-ink-2 underline decoration-[var(--hairline)] underline-offset-4 hover:text-[var(--ink)]"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label htmlFor="contract" className="sr-only">
              Your contract text
            </label>
            <div className="relative">
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
                readOnly={!!reading}
                aria-busy={!!reading}
                placeholder="Paste the full text of your contract here, in Spanish, or drop the PDF…"
                className="sheet block w-full resize-y px-5 py-4 text-[0.98rem] leading-relaxed outline-none transition-[height] placeholder:text-ink-2 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              />
              {dragging || reading ? (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-[3px] border-2 border-dashed border-[var(--ink)] bg-[var(--paper)] px-6 text-center">
                  <p className="grid justify-items-center gap-2" aria-live="polite">
                    <span className={reading ? "animate-pulse" : ""}>
                      <DocIcon />
                    </span>
                    <span className="font-serif text-[1.25rem] leading-tight">{reading ? `Reading ${reading}…` : "Drop the PDF to read it here"}</span>
                    <span className="text-[0.85rem] text-ink-2">It&apos;s read on your device. Nothing is sent until you press Check.</span>
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onPointerEnter={onPreparePdf}
                  onFocus={onPreparePdf}
                  disabled={!!reading}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--hairline)] bg-paper px-4 py-2 text-[0.92rem] font-semibold transition-[transform,box-shadow] duration-200 ease-[var(--ease)] hover:-translate-y-px hover:shadow-[var(--shadow-sheet)] active:scale-[0.98] disabled:opacity-50"
                >
                  <DocIcon />
                  Upload a PDF
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  data-testid="pdf-input"
                  onChange={(e) => {
                    take(e.target.files);
                    e.target.value = "";
                  }}
                />
                <a href="#samples" className="text-[0.92rem] font-semibold underline decoration-[var(--hairline)] underline-offset-4 lg:hidden">
                  Or try a sample ↓
                </a>
              </div>
              <button
                ref={submit}
                type="submit"
                disabled={empty || !!reading}
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-[0.98rem] font-semibold text-[var(--paper)] transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Check my contract
              </button>
            </div>
            <p className="text-[0.82rem] text-ink-2">A PDF is read on your device. We remove ID numbers, bank accounts, phone numbers and emails before analysis.</p>
          </form>
        </section>

        <section aria-labelledby="samples" className="rise scroll-mt-6 lg:pt-3" style={delay(240)}>
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
          <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-2">
            Samples are fictional contracts with a saved Claude reading, so they open instantly. The rules still run for real.
          </p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-2">
            To try the PDF upload, download{" "}
            <a href="/samples/traps-2025.pdf" download className="font-semibold text-[var(--ink)] underline decoration-[var(--hairline)] underline-offset-4">
              the traps contract as a PDF
            </a>{" "}
            and drop it in the box or use Upload a PDF. Checking it is a live check.
          </p>
        </section>
      </div>

      <ul className="rise mt-16 grid gap-6 border-t border-rule pt-8 sm:grid-cols-2 lg:grid-cols-4" style={delay(300)}>
        {TRUST.map((t) => (
          <li key={t.title}>
            <p className="text-[0.95rem] font-semibold">{t.title}</p>
            <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-2">{t.body}</p>
            {t.link ? (
              <a href={t.link.href} className="mt-2 inline-block text-[0.88rem] font-semibold underline decoration-[var(--hairline)] underline-offset-4 hover:decoration-[var(--ink)]">
                {t.link.label}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
