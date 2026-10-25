# Fair Lease

**Is your rental contract legal?** Paste a Madrid rental contract, or upload the PDF, and Fair Lease marks every clause Spanish law doesn't allow, on your own text, with the exact article, a plain-English explanation and what to ask for instead.

Made for people renting a home in Madrid, especially young people and students from abroad who don't read Spanish legal language.

**Try it now: [fair-lease.vercel.app](https://fair-lease.vercel.app)**. No account. Tap one of the three sample contracts and its problem clauses light up; click a highlight to see the article and what to ask for instead.

![A fictional contract with each unenforceable clause highlighted and a margin note with the article and the euros involved](docs/result-screen.png)

## How it works

1. **Your browser removes personal data** (ID numbers, IBANs, phone numbers, emails) before anything is sent. An uploaded PDF is read in the browser too ([pdf.js](https://mozilla.github.io/pdf.js/), loaded only when you pick a file): its text lands in the paste box and takes exactly the same path, so the file never leaves your device. Scanned PDFs with no text layer get a clear message; there is no OCR.
2. **Claude reads and quotes.** One server route asks Claude for the contract's facts (signing date, rent, landlord type…) and its clauses, each with a literal quote and a few plain facts. Structured output, no verdicts.
3. **The code checks every quote** is literally in your contract. Anything it can't find is dropped and counted.
4. **The signing date picks the law.** Spain's tenancy law changed in March 2019, May 2023 and again on 8 October 2026 (that last reform is still pending a vote in Congress).
5. **Fixed rules decide.** 22 rules written from the BOE turn those facts into verdicts, euro amounts, the article and what to ask for instead. See [docs/rules.md](docs/rules.md).

The three samples on the start screen skip step 2: their extraction is saved in the repo. Steps 3-5 still run for real every time, so the samples open instantly, work without an API key, and never fake the part that decides.

## Run it

Requires Node 22.20+.

```bash
npm install
npm run dev            # http://localhost:3000
```

The samples and the tests need no key. For live checks of a pasted contract, create `.env.local` from [`.env.example`](.env.example) with your own `ANTHROPIC_API_KEY`.

```bash
npm test               # unit tests: rules vs. expected results, quotes, law versions, money, letter, live route
npm run build
npm run check:ui       # Playwright checks at 1440 px and 390 px (runs `next start` on port 3100)
```

## Cost and speed (measured 24 Oct 2026)

| What | Model | Tokens in / out | Time | Cost |
|---|---|---|---|---|
| Live check, traps contract | Claude Sonnet 5.5 | 7,351 / 3,118 | 14 s | ≈ $0.05 |
| Live check, Oct 2026 contract | Claude Sonnet 5.5 | 6,349 / 1,875 | 10 s | ≈ $0.03 |
| Recording the three samples (once) | Claude Opus 5.5 | 20,872 / 7,950 | 15–22 s each | ≈ $0.24 total |

The public site allows 25 live checks a day (best effort, in memory). The hard cap is a spend limit on the API key.

In both live checks, Claude Sonnet 5.5 gave the same not-enforceable and worth-checking verdicts as the hand-made expected results, with every quote found in the text.

## Model alone vs Fair Lease

Is this just asking the AI? I measured it with the same model (Claude Sonnet 5.5), three runs each, against clauses labelled by hand. "Alone" is the plain question ("revisa este contrato de alquiler español firmado el ... y dime qué cláusulas no son exigibles según la LAU, con el artículo") with no rules and no quote check.

**Held-out set: six new contracts, 84 clauses, labelled and committed ([94e242c](https://github.com/antonmareo10/fair-lease/commit/94e242c)) before anything read them.** First run, as pre-registered:

| | Fair Lease | Sonnet 5.5 alone |
|---|---|---|
| Verdict matches the label (of 84 clauses) | 75 | 69.7 (69-71) |
| Problem clauses flagged at all (of 25) | 17 | 22 |
| Fine clauses called illegal or sent to review (of 59) | 1 | 6.3 |
| Right version of the law (of 6 contracts) | 6 | 3 |
| Euro figures right (of 7) | 7 | 5.0 (3-6) |
| Invented articles / quotes not in the contract | 0 / 0 | 0 / 0 |
| Cost per contract | $0.037 | $0.042 |

Fair Lease missed nine clauses, the same in every run: five it had no rule for (a sale ending the lease, two late-handover penalties, the "every clause was negotiated" boilerplate, all court costs on the tenant), three where a rule had a gap (a renewal fee, an optional service, a twelve-month lock-in) and one false alarm on a correct art. 9.3 clause. I added the four missing rules (FL-12, FL-20, FL-21, FL-22) and fixed the gaps, all from the same BOE-checked notes, and ran Fair Lease again from scratch: **84 of 84 in all three runs**, and 41 of 41 on the original three samples with the new prompt. That second number came after seeing the misses, so the blind result is the first run.

**Samples set: the three contracts the rules were built on, 41 clauses (24 Oct 2026).**

| | Fair Lease | Sonnet 5.5 alone |
|---|---|---|
| Verdict matches the expected one (of 41 clauses) | 41 | 29.3 (29-30) |
| Oct 2026 contract, clauses right (of 8) | 8 | 3.3 (3-4) |
| Right version of the law (of 3 contracts) | 3 | 1.3 (1-2) |
| Euro figures right (of 4) | 4 | 1.3 (1-2) |

Across both sets the model alone is a decent first reader and never made up a quote or an article. What it lacks is the date of the law (it applied a pre-reform text to all three October 2026 contracts, in every run), steady verdicts (it called a company's legal two-month guarantee not enforceable, and an over-the-limit one fine) and the arithmetic (it gave the traps contract's €7,141.50 total in none of three runs). The labels and the rules share an author, so read Fair Lease's scores as "the pipeline reproduces a hand-checked reading of the law", not as a lawyer's audit. Method, the nine misses by name, limits and every raw answer: [eval/README.md](eval/README.md). To recompute the tables without any API call: `npm run eval:score` (samples) and `npm run eval:score -- --set holdout --out eval/results-holdout-v2` (the fresh held-out run).

## Stack

Next.js 16.4 (App Router, TypeScript) with Tailwind CSS 4, the Anthropic TypeScript SDK, zod and pdf.js (PDF text read in the browser). Tested with Vitest and Playwright. Fonts: Newsreader and Inter.

## Built with the Devpost Learn Skill Pack

The plan lives in [`devpost/`](devpost): [scope](devpost/scope.md), [product requirements](devpost/prd.md), [technical spec](devpost/spec.md) and the [build checklist](devpost/checklist.md), made with the [Build With AI: Basics](https://github.com/challengepost/learn-ai-basics) skill pack. `skills-lock.json` records the pack's source.

**Prepared before the project folder was created (no code):** legal research notes on the LAU (checked against the BOE), and three fictional sample contracts with their expected results. These were prepared with AI help.

## License

[MIT](LICENSE). The skill pack used for planning is MIT-licensed by its authors.

## Not legal advice

Fair Lease is an information tool. It checks a contract against a small set of rules and shows the exact article. For a decision that matters, talk to a tenants' union, your city's consumer office or a lawyer.
