# Fair Lease

**Is your rental contract legal?** Paste a Madrid rental contract and Fair Lease marks every clause Spanish law doesn't allow, on your own text, with the exact article, a plain-English explanation and what to ask for instead.

Made for people renting a home in Madrid, especially young people and students from abroad who don't read Spanish legal language.

**Try it now: [fair-lease.vercel.app](https://fair-lease.vercel.app)**. No account. Tap one of the three sample contracts and its problem clauses light up; click a highlight to see the article and what to ask for instead.

![A fictional contract with each unenforceable clause highlighted and a margin note with the article and the euros involved](docs/result-screen.png)

## How it works

1. **Your browser removes personal data** (ID numbers, IBANs, phone numbers, emails) before anything is sent.
2. **Claude reads and quotes.** One server route asks Claude for the contract's facts (signing date, rent, landlord type…) and its clauses, each with a literal quote and a few plain facts. Structured output, no verdicts.
3. **The code checks every quote** is literally in your contract. Anything it can't find is dropped and counted.
4. **The signing date picks the law.** Spain's tenancy law changed in March 2019, May 2023 and again on 8 October 2026 (that last reform is still pending a vote in Congress).
5. **Fixed rules decide.** 18 rules written from the BOE turn those facts into verdicts, euro amounts, the article and what to ask for instead. See [docs/rules.md](docs/rules.md).

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

## Stack

Next.js 16.4 (App Router, TypeScript) with Tailwind CSS 4, the Anthropic TypeScript SDK and zod. Tested with Vitest and Playwright. Fonts: Newsreader and Inter.

## Built with the Devpost Learn Skill Pack

The plan lives in [`devpost/`](devpost): [scope](devpost/scope.md), [product requirements](devpost/prd.md), [technical spec](devpost/spec.md) and the [build checklist](devpost/checklist.md), made with the [Build With AI: Basics](https://github.com/challengepost/learn-ai-basics) skill pack. `skills-lock.json` records the pack's source.

**Prepared before the project folder was created (no code):** legal research notes on the LAU (checked against the BOE), and three fictional sample contracts with their expected results. These were prepared with AI help.

## License

[MIT](LICENSE). The skill pack used for planning is MIT-licensed by its authors.

## Not legal advice

Fair Lease is an information tool. It checks a contract against a small set of rules and shows the exact article. For a decision that matters, talk to a tenants' union, your city's consumer office or a lawyer.
