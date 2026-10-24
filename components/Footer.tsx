import Link from "next/link";
import { REPO_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-[1240px] border-t border-rule px-4 pb-10 pt-6 text-[0.82rem] text-ink-2 sm:px-8">
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/privacy" className="underline decoration-[var(--hairline)] underline-offset-4 hover:text-ink">
          Privacy &amp; Terms
        </Link>
        <a href={`${REPO_URL}/blob/main/docs/rules.md`} className="underline decoration-[var(--hairline)] underline-offset-4 hover:text-ink">
          Rules and sources (BOE)
        </a>
        <a href={REPO_URL} className="underline decoration-[var(--hairline)] underline-offset-4 hover:text-ink">
          Source code
        </a>
        <span>Not legal advice</span>
      </nav>
      <p className="mt-3 max-w-[52rem] leading-relaxed">
        Free help in Madrid: SAVMadrid, the city&apos;s housing advice service run with the Madrid Bar (ICAM). Appointments on{" "}
        <a href="tel:+34900814815" className="underline decoration-[var(--hairline)] underline-offset-4">
          900 814 815
        </a>
        , Mon, Wed and Fri, 9:00–14:00.
      </p>
    </footer>
  );
}
