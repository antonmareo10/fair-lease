"use client";

export type StepState = "done" | "active" | "todo";
export type Step = { label: string; detail?: string; state: StepState };

/** Real steps only, ticked as each phase finishes: no fake progress bar (prd.md > States and Boundaries). */
export function CheckingSteps({ steps, from }: { steps: Step[]; from?: string }) {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-10 sm:px-8 sm:pt-16">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="sheet grid gap-4 px-6 py-10 sm:px-14 sm:py-14" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="grid gap-2">
              <div className="h-3 animate-pulse rounded bg-[var(--rule)]" style={{ width: `${30 + ((i * 17) % 25)}%` }} />
              <div className="h-3 animate-pulse rounded bg-[var(--rule)]/70" />
              <div className="h-3 animate-pulse rounded bg-[var(--rule)]/70" style={{ width: `${70 + ((i * 13) % 25)}%` }} />
            </div>
          ))}
        </div>
        <section aria-live="polite" aria-label="Checking your contract" className="grid gap-4 lg:sticky lg:top-8">
          <div>
            <h1 className="font-serif text-[1.8rem] leading-tight">Checking your contract</h1>
            {from ? <p className="mt-1 truncate text-[0.88rem] text-ink-2">{from}, read on your device</p> : null}
          </div>
          <ol className="grid gap-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-start gap-3">
                <span
                  className={`mt-[3px] grid h-[18px] w-[18px] flex-none place-items-center rounded-full border text-[0.7rem] font-bold ${
                    s.state === "done"
                      ? "v-OK border-transparent bg-[var(--chip)] text-[var(--paper)]"
                      : s.state === "active"
                        ? "animate-pulse border-[var(--ink)]"
                        : "border-[var(--rule)]"
                  }`}
                  aria-hidden="true"
                >
                  {s.state === "done" ? "✓" : ""}
                </span>
                <span className={s.state === "todo" ? "text-ink-2" : ""}>
                  <span className="font-medium">{s.label}</span>
                  {s.detail ? <span className="block text-[0.85rem] text-ink-2">{s.detail}</span> : null}
                  <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "active" ? " (in progress)" : ""}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
