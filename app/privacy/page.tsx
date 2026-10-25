import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Brand";
import { Footer } from "@/components/Footer";
import { DISCLAIMER } from "@/lib/rules/texts";

export const metadata: Metadata = {
  title: "Privacy & Terms — Fair Lease",
  description: "What Fair Lease does with your contract, and what it is not.",
};

const POINTS = [
  {
    title: "Your contract is not stored",
    body: "There's no database and no account. The text lives only in your browser tab while you look at it. Reload the page and it's gone. The server doesn't log the contract's text.",
  },
  {
    title: "A PDF never leaves your device",
    body: "If you upload a PDF, your browser reads its text with pdf.js, on your device. The file itself is never sent. Its text goes into the box, and from there it's treated exactly like pasted text. Scanned PDFs (pictures of pages) have no text to read, and Fair Lease doesn't do OCR.",
  },
  {
    title: "Personal data is removed first",
    body: "Before anything leaves your browser, ID numbers (DNI and NIE), bank accounts (IBAN), Spanish phone numbers and emails are replaced with tags like [DNI]. Names are not removed: simple rules can't find them reliably.",
  },
  {
    title: "Live checks use Anthropic's API",
    body: "When you check your own contract, the anonymised text is sent to Anthropic's Claude API, which only extracts the clauses and quotes them. The samples don't use the API at all.",
  },
  {
    title: "The rules decide, and they're public",
    body: "Every verdict comes from a fixed rule written from the Spanish law (LAU and related texts in the BOE), not from the AI. The rules and their sources are in the public repository.",
  },
  {
    title: "Not legal advice",
    body: DISCLAIMER,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <Link href="/" className="text-[0.9rem] font-medium text-ink-2 hover:text-ink">
          ← Back to Fair Lease
        </Link>
        <h1 className="mt-6 font-serif text-[2.4rem] leading-tight tracking-[-0.01em]">Privacy &amp; Terms</h1>
        <p className="mt-3 text-[1rem] text-ink-2">The short version: we don&apos;t keep your contract, and Fair Lease is an information tool, not a lawyer.</p>
        <div className="mt-8 grid gap-6">
          {POINTS.map((p) => (
            <section key={p.title}>
              <h2 className="text-[1.05rem] font-semibold">{p.title}</h2>
              <p className="mt-1 leading-relaxed text-ink-2">{p.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
