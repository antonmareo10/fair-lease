---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast. Chosen by the learner through his delegation: the agent builds, verifies and commits each slice, and runs the hands-on checks itself in a headless browser (Playwright) at desktop and phone widths.

## Slices

- [x] **1. Tap the traps sample and watch the contract light up with real verdicts**
  Becomes usable: A running app. The start screen has the three sample buttons (only the traps one wired). Tapping it shows the 2025 contract as a paper sheet with verdict-coloured highlights and the summary "10 not enforceable · 2 worth checking · 6 fine", all decided by the real rules engine.
  Why now: This is the unique kernel. The AI's output (here a hand-made extraction labelled as such) is quote-checked against the text, and fixed rules decide using the law version picked from the signing date. Building it first means everything later decorates a working core. Bootstrapping lives here.
  PRD ref: `prd.md > The Core Journey` (steps 1-4), `prd.md > Samples`, `prd.md > Quote Check`, `prd.md > Findings and Verdicts`
  Spec ref: `spec.md > Stack`, `spec.md > File Structure`, `spec.md > Data Model`, `spec.md > Samples`, `spec.md > Quote Verifier`, `spec.md > Law Version Resolver`, `spec.md > Rules Engine`, `spec.md > Result View`, `spec.md > Look and Feel`
  Build:
  - Scaffold Next.js (App Router, TypeScript, Tailwind) with Vitest and Playwright, plus the tokens and fonts from `spec.md > Look and Feel`.
  - `lib/extraction.ts` (zod schema and types), `lib/quotes.ts`, `lib/law.ts` and `lib/analyze.ts`.
  - The rules the traps contract needs (FL-01, 02, 03, 04, 05, 07, 08, 09, 11, 13, 14, 15, 16, 18 plus the known-legal checks), with texts copied from `LEGAL_RULES.md`.
  - `samples/traps-2025.json`: the contract text plus a hand-made extraction from `GOLD.md`, with `provenance.kind: "hand-made"`.
  - The start screen, the sheet with highlights, and the summary counts.
  Verify (mechanical):
  - `npm test` passes: the traps fixture gives exactly the `GOLD.md` verdicts per clause (10 ILLEGAL, 2 CHECK, 6 OK) with 0 hidden quotes, and the quote-verifier unit tests pass.
  - `npm run build` succeeds.
  - A Playwright script opens `/`, taps the traps sample and asserts the summary text and the number of highlights, saving a 1440 px screenshot.
  Learner check: Open http://localhost:3000, tap "A contract full of traps (2025)" and look at the sheet. Do the coloured clauses and the counts read clearly, and does it feel like an annotated paper contract rather than a dashboard?
  Commit: `Annotate the traps sample with real rule verdicts`

- [x] **2. Open any finding and get the article, the euros and what to ask for instead**
  Becomes usable: Clicking a highlight or its margin note opens the finding: verdict chip, plain title, explanation, computed number, the Spanish law quote with English translation and BOE link, and "Ask for this instead" with Copy and an ES/EN switch. Clauses with several findings show stacked badges and a count mark. The money line appears. On a phone the finding opens in a bottom sheet over the text. J/K and Enter work.
  Why now: This turns verdicts into something a tenant can act on, and it settles the hardest layout question (margin vs. bottom sheet, overlapping findings) while feedback can still shape slices 3-5.
  PRD ref: `prd.md > Findings and Verdicts`, `prd.md > Money Line`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Result View`, `spec.md > Money Calculator`, `spec.md > Rules Engine`
  Build: `lib/money.ts`. `MarginNotes`, `FindingNote` and `FindingSheet` (below 768 px). Multi-finding span merging with the count badge. Copy with a "Copied" toast. The ES/EN toggle. Keyboard navigation. Scroll-and-pulse on open.
  Verify (mechanical):
  - `npm test` includes the money tests: the traps sample gives €11,741.50 committed, a €4,600 legal maximum and €7,141.50 over.
  - At 1440 px and 390 px, Playwright opens clause QUINTA and asserts three stacked findings with the not-enforceable one first, asserts the BOE link href, clicks Copy and sees "Copied", and asserts no horizontal scroll at 390 px. Screenshots saved.
  Learner check: On the traps sample, open the bank-guarantee note and the clause-5 stack, copy "Ask for this instead", then try the same on a phone-width window. Is the finding easy to read and act on in both layouts?
  Commit: `Open findings with law, euros and what to ask instead`

- [x] **3. The law knows the date: the reform sample, the fair sample and the timeline**
  Becomes usable:
  - All three samples work.
  - The timeline shows Mar 2019 · May 2023 · Oct 2026 with the marker on the signing date and its sentence.
  - The Oct 2026 sample flips the purchase-right waiver to red, with "pending Congress vote" tags.
  - The fair contract shows the green "No problems found in the {n} rules we check" state with its Fine and Your-right notes.
  - A contract with no date shows the one-line notice and a date picker that re-runs the rules.
  - Edge dates and non-Madrid contracts show their notices.
  Why now: The date-aware law is the second half of the kernel and the strongest demo moment. It needs the finding UI from slice 2 to show the flip.
  PRD ref: `prd.md > Law Version and Timeline`, `prd.md > States and Boundaries`, `prd.md > Notices`
  Spec ref: `spec.md > Law Version Resolver`, `spec.md > Rules Engine`, `spec.md > Samples`, `spec.md > Result View`
  Build:
  - The remaining rules: FL-06, FL-10, FL-17, FL-19, the "Your right" findings (no update clause, the DF 6ª window), and the regime-C variants of FL-02, FL-03 and FL-07.
  - `samples/fair-2024.json` and `samples/reform-oct-2026.json` (hand-made from `GOLD.md`).
  - `Timeline` with the date picker, `Notices`, and the clean state.
  Verify (mechanical):
  - `npm test` passes `GOLD.md` for all three contracts:
    - fair: 0 ILLEGAL, 0 CHECK, plus the DF 6ª note;
    - reform: FL-19, 17, 10, 07, 18 ILLEGAL with the pending tag;
    - the same waiver is OK in 2025 and ILLEGAL in Oct 2026.
  - Law-resolver tests cover 25/26 May 2023, 1-2 Oct 2026, 7/8 Oct 2026, pre-2019 and no date.
  - Playwright asserts the timeline sentence for each sample and that the date picker changes the findings on a no-date fixture.
  Learner check: Tap each sample in turn and watch the timeline marker move. Does the red/green flip on the purchase-right waiver make the "law depends on the date" point obvious?
  Commit: `Pick the law version from the signing date across all samples`

- [x] **4. Paste your own contract and get it checked live**
  Becomes usable:
  - Pasting text and pressing Check removes personal data (with a count) and sends it to the server route.
  - The real checking steps tick off, and the same annotated result appears.
  - Empty, too-short and too-long input is handled.
  - "Not a Spanish rental contract", "Live checks are paused" (API failure or daily limit) and hidden quotes all show their messages, with the samples offered.
  Why now: The live path rides on everything above, so it's only wiring plus its failure states. The real API call waits for the key (slice 6). Here it's verified with an injected test client, which is not a fake kernel: the rules and the quote check still run.
  PRD ref: `prd.md > Contract Input`, `prd.md > Live Analysis`, `prd.md > States and Boundaries`, `prd.md > The Core Journey` (steps 2-3)
  Spec ref: `spec.md > Input Validator`, `spec.md > Anonymizer`, `spec.md > Live Analysis Route`, `spec.md > Daily Live Limit`, `spec.md > Checking Steps`, `spec.md > Important Failure Modes`
  Build: `lib/validate.ts`, `lib/anonymize.ts`, `lib/claude.ts` (Anthropic client, prompt, structured output, fallbacks for Sonnet 5.5), `lib/limit.ts`, `app/api/extract/route.ts` (client injectable for tests), `CheckingSteps`, error states, `.env.example`.
  Verify (mechanical):
  - `npm test` covers the anonymiser (catches the demo DNIs/NIE, IBAN, phone, email), the validator bounds, and the limit counter.
  - Route tests with an injected fake client cover: success, a `refusal` stop → "unavailable", invalid JSON → one retry then "unavailable", the limit reached → "limit", and `is_rental_contract: false` → "not_a_contract".
  - Playwright, with the route intercepted, pastes the fair contract and sees the result, sees the paused message when the route errors, and sees Check disabled when the box is empty.
  Learner check: Paste a few lines of text, then a full contract, then an English paragraph. Do the messages say clearly what happened and what to do next?
  Commit: `Check pasted contracts live with anonymisation and clear failure states`

- [x] **5. Write to my landlord, trust details and polish**
  Becomes usable:
  - "Write to my landlord" builds the ES/EN message from the not-enforceable findings, with Copy.
  - Footer, Privacy & Terms page, disclaimer and SAVMadrid line.
  - Own icon, title and share preview.
  - Highlighter painting, counters and staggered notes; dark mode; reduced motion.
  - `docs/rules.md` and a README that declares the prepared material.
  Why now: These close the journey (step 6) and carry the trust and design details judges notice, on top of a complete working loop.
  PRD ref: `prd.md > Write to My Landlord`, `prd.md > Notices`, `prd.md > Look and Feel`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Landlord Message Builder`, `spec.md > Privacy & Terms and Footer`, `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`
  Build: `lib/letter.ts` and `LetterPanel`. `Footer`, `app/privacy/page.tsx`, `app/icon.svg`, metadata. Motion with the reduced-motion path. The dark tokens. `docs/rules.md` from `LEGAL_RULES.md`. README.
  Verify (mechanical):
  - `npm test` covers the letter: all 10 not-enforceable findings with articles for traps, and none for fair.
  - `npm run lint`, `npx tsc --noEmit` and `npm run build` are clean.
  - Playwright at 1440 and 390 px, light and dark, with reduced motion, checks: the letter copy works, the privacy page loads from the footer, there's no horizontal scroll, the icon and title are present, and focus is visible on Tab. Screenshots saved.
  Learner check: Run the whole journey on a phone-width window and in dark mode, write the landlord message for the traps sample, and open the privacy page. Does anything feel unfinished or generic?
  Commit: `Add landlord message, trust pages and finishing polish`

- [x] **6. Real Claude: record the samples and check a live paste**
  Becomes usable:
  - The three samples carry real recorded extractions from Claude Opus 5.5, labelled with model and date.
  - A pasted contract is analysed live by Claude Sonnet 5.5, with the cost per check measured.
  Why now: Last only because the key arrives last. This is the main remaining risk: does Claude's extraction reproduce the `GOLD.md` verdicts with every quote found? It's checked against the tests built in slices 1-4.
  PRD ref: `prd.md > Live Analysis`, `prd.md > Samples`, `prd.md > Quote Check`
  Spec ref: `spec.md > External Services and Dependencies`, `spec.md > Samples`, `spec.md > Live Analysis Route`, `spec.md > Decisions and Open Issues`
  Build:
  - With `ANTHROPIC_API_KEY` in `.env.local` (pasted by Antón), confirm the request shape on Haiku 5.5: structured output, plus `fallbacks` on Sonnet 5.5.
  - Run `scripts/record-samples.ts` with Opus 5.5.
  - Compare against `GOLD.md`. Fix the prompt or the signal definitions if needed, never the rules.
  - One live paste on Sonnet 5.5. Record `usage` and the cost in the README.
  Verify (mechanical):
  - `npm test` passes with the recorded sample files replacing the hand-made ones: same verdicts, 0 hidden quotes.
  - A live paste of the traps contract through `/api/extract` on Sonnet 5.5 returns the same rule IDs and verdicts.
  - `npm run build` is clean.
  Learner check: Paste one of the sample contracts as your own text and compare the live result with the recorded sample. Same verdicts, same highlights?
  Commit: `Record sample extractions with Claude and verify live analysis`

## Hands-on Checkpoints

The learner delegated hands-on checks to the agent, run in a headless browser (Playwright) at 1440 px and 390 px. Each check records what was looked at and what changed.

- [x] Early usable behavior explored — after slice 2 (annotated traps sample with findings, desktop and phone). Done by the agent in headless Chromium at 1440 px and 390 px, as delegated, with screenshots under `e2e/screenshots/`. What was looked at: the money line, the clause QUINTA stack, the law disclosure, the BOE link, Copy, the ES/EN switch and the J/K keys. Change made: in an open margin note, only one finding shows its details at a time (the most severe first), because opening all three in clause QUINTA made the margin far taller than the sheet.
- [x] Final kick-the-tires exploration and feedback completed. Run by the agent under the learner's delegation, in headless Chromium at 1440 px and 390 px, light and dark. Covered: the whole journey on all three samples, two real live checks through `/api/extract` with Claude Sonnet 5.5 (`e2e/real-live.spec.ts`), and awkward inputs (empty, too short, over 60,000 characters, an English notice that isn't a contract).

## Final Review

- [x] On a phone the samples were below the paste box, out of sight on the first screen. Added an "Or try a sample ↓" jump next to the button. Verified in `e2e/inputs.spec.ts`, which checks it's in the viewport and that tapping it brings the samples into view.
- Real live check of an edited contract (rent changed to €1,200, an email added): 10 not enforceable · 2 worth checking · 6 fine. The figures were recalculated from the new rent (€11,891.50 committed against a €4,800 legal maximum), and the email showed as [EMAIL]. Non-contract text got the clear "doesn't look like a Spanish rental contract" message. No other changes were needed.
- [x] Final review complete — feedback resolved and learner confirms ready to ship. Readiness was confirmed under the learner's delegation: he asked the agent to run the reviews and move on to 6-ship.

## Code Tour and App Map

- [x] Learning activity complete — prior practice connected, as an evidence-based recap. The learner delegated the session, so it was not hands-on for him.
- [x] Optional edit and transfer reflection addressed. Edit: not applicable (delegated session). Transfer question: offered to the learner through the person relaying the session, answer optional.
- [x] `devpost/app-map.html` generated from finished code (commit 7073779), checked, and shown, including a project-grounded practice to reuse. Every path checked against the source; rendered at 390 px in headless Chromium with no horizontal scroll. Shown through the relay.

Activity and evidence:
- The learning intention ("make what an AI says checkable: it only extracts and quotes, the code checks the quote, fixed rules decide") was practised during the build itself.
- The spec's useful unknown, how strict the quote check can be, was settled with evidence: 0 hidden quotes across three Opus recordings and three real Sonnet/Haiku live checks.
- Model output was tested against the expected verdicts: `tests/recorded.test.ts`, the robustness test in `tests/gold.test.ts`, the FL-07 change.

Route and stops: reference route only (`devpost/app-map.html`): `components/FairLease.tsx` `checkLive` → `lib/analyze.ts` `analyze` → `lib/rules/fl02-extra-guarantees.ts` `fl02.evaluate` → `components/result/FindingNote.tsx`. Not toured live.
Edit outcome: not applicable (delegated session).
Reflection: offered through the relay, optional.
Activity mode: recap of prior practice. Not a hands-on activity by the learner.

## Revisions
- All 18 FL rules were written in slice 1, not split across slices 1 and 3. They share helpers and texts, so writing them together was simpler. Verification of the regime-C and fair-contract behaviour stays in slice 3, as planned.
- `Finding.clauseIndices` (a list) replaces the spec's single `clauseIndex`. FL-19 is one finding that rests on several clauses (the 'seasonal' title, the exclusion of home rules, the successive renewals), which is how `GOLD.md` counts it (5 rules, not 6 findings).
- Next.js scaffolded at 16.4.3 with Cache Components on. Route handlers must not export `runtime`, so the spec's 'Node runtime' note means the default runtime, with no segment config.
- Slice 3's date-picker check runs as a unit test (an undated extraction plus a picked date re-runs the rules, with no new extraction). The browser version of that check moves to slice 4: the samples all have dates, so the UI has no undated input until pasting works.
- The samples are anonymised when they open, like pasted text, instead of being stored already anonymised. Their [DNI] tags then show the privacy step in the demo, and the 'Removed before analysis' line is real for samples too.
- After the reply arrives, the last three checking steps tick off at a readable pace (about 0.16 s each). The work itself takes milliseconds in the browser, and each step ticks only once its work is done.
- A date picked for an undated contract is labelled 'You picked…' rather than 'Signed…', so the result never claims the contract says something it doesn't.
- The engine tests now run on the hand-made fixtures (exact `GOLD.md` rows). A separate test checks the shipped samples, which carry Claude Opus 5.5's recorded extraction: 0 hidden quotes, and the same not-enforceable and worth-checking verdicts as `GOLD.md`. Claude quotes more 'fine' clauses than the hand-made fixtures (payment by transfer, utilities), which is correct but made exact row-for-row tests the wrong measure.
- FL-07 now marks 'no leaving in the first six months' as fine even when the same passage adds a penalty. Opus quoted clause NOVENA as one passage, which had hidden that fine note and broken the 10 / 2 / 6 headline.
- Findings with the same rule, verdict and clause are merged into one, with every quote highlighted. Haiku split clause SEGUNDA into two sentences, and both triggered FL-05 (11 not enforceable instead of 10).
- Live model check (`npm run try-live`): Claude Sonnet 5.5 matched the expected verdicts on the traps (14 s, about $0.05) and Oct 2026 (10 s, about $0.03) contracts. Structured output and `fallbacks: "default"` work together on `claude-sonnet-5-5`.
- The first screen of a result now shows the numbers, the euros, the law timeline and the first marked clause with its margin note (it started 1,000 px down the sheet, behind the contract's parties and background). The unmarked opening (title kept) folds into one "Show the opening" line, the timeline moved to the margin column, and on a phone the timeline's track sits below the sheet. An e2e check keeps the first highlight inside the first screen on desktop (1440x900) and phone (390x844).
- After shipping (25 Oct 2026), the PDF upload that `scope.md` listed under Later and `prd.md` cut first was added: pdf.js reads the text layer in the browser, the text goes into the paste box ("read on your device, nothing sent yet") and Check takes the same anonymise-then-extract path. Scans (no OCR), password-protected, damaged, oversized and non-PDF files get their own message. Unit tests read the three sample PDFs (same text and verdicts as the pasted samples) and fixtures for two columns, a browser-saved PDF with no paragraph spacing, a scan, a password and a truncated file; Playwright drops a PDF and checks that nothing is sent before Check.
- A held-out evaluation was added: six new fictional contracts and 84 hand labels, committed (94e242c) before any run. The first run gave Fair Lease 75 of 84 and Sonnet alone 69.7; Fair Lease's nine misses are listed by name in `eval/README.md`.
- Because of those misses, the four rules `spec.md` deferred (FL-12, FL-20, FL-21, FL-22) were added from `LEGAL_RULES.md`, with six new extraction signals and two prompt sentences. FL-03 now reads fees whatever topic the model gives them (and an optional service since Oct 2026), FL-07 flags a lock-in longer than the law allows, and FL-06 reads the clause's whole paragraph from the contract instead of only the quote. A fresh run gave 84 of 84 on the held-out set and 41 of 41 on the samples. The app now says 22 rules.
- Design pass after shipping: the start screen rises in once (off with reduced motion), a fourth note links to the evaluation, Upload and Remove are 44 px tall on touch, and the checking screen names the PDF it reads. Rehearsing the video clip on held-out contract H3 showed "cash plus a guarantees" in the money line when the extra guarantee is a cash deposit; it now says "cash plus extra guarantees". Final counts: 136 unit tests and 64 Playwright checks passing (8 skipped: the real-API checks and one desktop-only check).
