import Link from "next/link";

/** The Fair Lease mark: a margin bracket with a tick, as if annotating a page. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--ink)" />
      <path d="M12 7.5H9.5v17H12" fill="none" stroke="var(--paper)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 16.4l3.1 3.1 6-7" fill="none" stroke="#f0623f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** On the app screen the logo resets the view; on other pages (Privacy & Terms) it is a plain link home. */
export function Header({ onHome }: { onHome?: () => void }) {
  const brand = (
    <>
      <Mark />
      <span className="font-serif text-[1.35rem] font-semibold tracking-[-0.01em]">Fair Lease</span>
    </>
  );
  return (
    <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 pt-5 sm:px-8 sm:pt-7">
      {onHome ? (
        <button type="button" onClick={onHome} className="flex items-center gap-2.5 rounded-md" aria-label="Fair Lease, back to start">
          {brand}
        </button>
      ) : (
        <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label="Fair Lease, back to start">
          {brand}
        </Link>
      )}
      <p className="hidden text-[0.82rem] text-ink-2 sm:block">Spanish rental law, checked against the BOE</p>
    </header>
  );
}
