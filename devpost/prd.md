---
doc: prd
status: approved
---

# Fair Lease — Product Requirements

A free web page where someone about to rent in Madrid pastes their contract and sees which clauses Spanish law doesn't allow, marked on their own text with the exact article, a plain-English explanation and what to ask for instead.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **Arrive.** In 2-3 seconds the first screen says what this is and who it's for: "Is your rental contract legal?" and "Made for people renting a home in Madrid." No sign-up, no cookie wall.
2. **Give it a contract.** Paste the text into the box and press **Check my contract**, or tap one of three samples: "A contract full of traps (2025)", "A fair contract (2024)", "Signed after the Oct 2026 reform".
3. **Watch it being checked.** Real steps light up as they happen: *Removing personal data* (with the count) → *Reading clauses* → *Checking the date and the law version* → *Applying {n} rules* → *Verifying every quote is in your contract*. The sheet's skeleton appears in its final shape.
4. **See the result.** The contract appears as a paper sheet. The clauses with findings get a highlighter "painted" in the colour of their verdict, in reading order. At the top: counts (e.g. "10 not enforceable · 2 worth checking · 6 fine"), the money line when the contract's own numbers allow it, and the law timeline with a marker on the signing date.
5. **Read one finding.** Click a highlight, or its note in the margin, to open it. You get the verdict, a plain-English explanation, the computed number, the article (Spanish quote, English translation, BOE link) and "Ask for this instead" with a **Copy** button.
6. **Act on it.** **Write to my landlord** assembles a polite message listing every clause that isn't enforceable, with its article. **Copy** it.
7. **Success:** the tenant knows what they can push back on and has the words to do it, before signing.

## Screens and Layout
Source: `scope.md > Inspiration & Identity`.

- **Start screen** (one page): headline and one-line subtitle ("Paste it. Fair Lease marks every clause Spanish law doesn't allow, with the exact article and what to ask for instead."), the paste box with **Check my contract**, the three sample buttons, and a trust strip of three short lines: "Rules hand-checked against the BOE" · "Claude reads, the rules decide" · "Your contract is not stored".
- **Checking state**: on the same page, the steps list and the sheet skeleton.
- **Result screen**
  - **Desktop:** two columns. Left, the contract sheet. Right, a sticky margin with the summary, the timeline and the finding notes lined up next to their clauses.
  - **Mobile (390 px):** the annotated sheet fills the screen. Tapping a highlighted clause slides up a bottom sheet with its finding(s), and the text stays visible behind it. The summary and timeline sit above the sheet.
  - A **Check another contract** action returns to the start screen.
- **Privacy & Terms**: a short page reached from the footer.
- **Footer** on every screen: Privacy & Terms · Rules and sources (BOE) · Source code · "Not legal advice".

## Look and Feel
Source: `scope.md > Inspiration & Identity`.

- **Concept:** your contract, annotated in the margin by a friend who knows the law. No dashboard, no chatbot.
- **Paper and ink:** paper `#FBF8F1`, ink `#1D1B18`, secondary text `#6B665E`. Dark mode: sheet `#1E1D1B` on `#141312`, same hues a step lighter.
- **Verdict highlighters**, translucent on paper, with chip text colours checked for ≥ 4.5:1 contrast:

  | Verdict | Highlighter | Chip text | Icon |
  |---|---|---|---|
  | Not enforceable | `rgba(232,72,40,.26)` | `#B3341A` | ✕ in a circle |
  | Worth checking | `rgba(240,170,40,.30)` | `#8A5A00` | ! in a triangle |
  | Fine | `rgba(70,160,100,.22)` | `#23673F` | ✓ |
  | Your right | `rgba(70,120,220,.20)` | `#24509A` | i |

  The icon always comes with text; colour is never the only signal.
- **Type:** the contract in a reading serif (Newsreader or Source Serif 4) and the interface in a clean sans (Inter or Geist). Figures in tabular numerals.
- **Motion:** one easing everywhere (`cubic-bezier(0.22, 1, 0.36, 1)`).
  - The highlighter paints left to right, staggered 80 ms per clause in reading order.
  - Counters climb to their real values, notes enter staggered, and the timeline marker slides to its date.
  - **Copy** shows a "Copied" toast.
  - With reduced motion, everything appears already painted, without smooth scrolling.
- **Identity:** its own icon, page title and share preview, not framework defaults.
- **Avoid:** yellow as the main highlighter (another entry uses "paper + yellow"), magic scores, mascots, house illustrations, purple gradients, emoji in the UI, and a scary tone. Red appears only where the law says so, and green is shown too.
- **Words:** clear verbs that work for mouse and touch alike: Paste, Check, Open, Copy. No "tick" and no gesture-only actions.

## Features and Behavior

### Contract Input
Source: `scope.md > The POC Boundary`.

- Pasting text is the only input in this proof of concept.
- Before anything leaves the browser, ID numbers (DNI/NIE), IBANs, Spanish phone numbers and emails are replaced with tags such as `[DNI]`, and the app says how many it removed. Under the box: "We remove ID numbers, bank accounts, phone numbers and emails before analysis." Names are not promised.
- Acceptance:
  - [ ] **Check my contract** is disabled while the box is empty or whitespace only.
  - [ ] Text that's too short to be a contract (under ~300 characters) or over 60,000 characters gets a clear message saying why, plus a sample to try, and is not sent.
  - [ ] After a live check, the steps list shows the real number of personal-data items removed, and the sheet shows the tags in their place.

### Samples
Source: `scope.md > The POC Boundary`.

- Each sample button fills the sheet with that fictional contract and runs the check at once. It uses a recorded AI extraction, but the rules and the quote check run for real every time.
- It's labelled "Sample · recorded extraction". It never waits on, or spends, API credit.
- Acceptance:
  - [ ] All three samples give a full result with no network call to the AI, including when live analysis is unavailable.
  - [ ] Each sample result is labelled as a sample.

### Live Analysis
- The AI reads the anonymised text and returns the contract facts (signing date, rent, duration, landlord type, contract type, stated reason for a temporary contract, agency, city) and the clauses, each with a literal quote, topic and numbers. It gives no verdicts.
- Acceptance:
  - [ ] A pasted copy of a sample contract produces the same verdicts as that sample's recorded result. Small wording differences in the explanations are fine; verdicts and rule IDs must match.

### Quote Check
Source: `scope.md > The Unique Kernel`.

- Every quote is matched against the contract text, ignoring differences in spacing and quote marks. A quote that isn't there is dropped and never shown, and the result says so: "2 suggestions hidden because we couldn't find the exact words in your contract."
- Acceptance:
  - [ ] Every visible highlight covers text that is literally in the pasted contract.
  - [ ] When a quote is dropped, the hidden-count line appears with the right number.

### Law Version and Timeline
Source: `scope.md > The Unique Kernel`.

- The signing date picks the law version:
  - 6 Mar 2019 – 25 May 2023 → 2019 rules.
  - 26 May 2023 – 7 Oct 2026 → 2023 rules.
  - From 8 Oct 2026 → the 8 Oct 2026 reform, tagged "pending Congress vote".
- The timeline shows three milestones (Mar 2019 · May 2023 · Oct 2026), a marker on the signing date and a sentence like "Signed 1 Sep 2025 → the May 2023 rules apply".
- **No signing date found** (e.g. an unsigned draft): the check uses the law in force today and says so in one line at the top: "No signing date found: checked against the law in force today, 24 Oct 2026". The tenant can pick a date; the marker moves and the findings update to that version of the law.
- **Signed on 1 or 2 Oct 2026:** treated as 2023 rules, with a warning: "Signed during a two-day legal window; check with a professional."
- **Signed before 6 Mar 2019:** an out-of-scope notice ("contract from before 2019, the rules may be different"). It does not block the result.
- Acceptance:
  - [ ] The 2025 sample shows "the May 2023 rules apply". The Oct 2026 sample moves the marker to Oct 2026 and shows the "pending Congress vote" tag on the new-law findings.
  - [ ] The same purchase-right waiver is **Fine** in the 2025 sample and **Not enforceable** in the Oct 2026 sample.
  - [ ] With no date in the text, the one-line notice appears. Picking a date updates the marker and the findings without another AI call.

### Findings and Verdicts
Source: `scope.md > The POC Boundary`.

- Code decides with hand-checked rules. There are only four verdicts:
  - **Not enforceable under Spanish law:** the law forbids it or makes it void.
  - **Worth checking:** it depends on a fact that's missing, or the law isn't settled.
  - **Fine:** legal even if it feels harsh, e.g. no pets. Each comes with a one-line reason.
  - **Your right:** something the law gives you that the contract doesn't mention.
- Each note has the verdict chip, a plain title ("Deposit above the legal limit"), 1-2 sentences, the computed number when there is one ("€3,450 over the limit") and **What the law says · LAU art. 36.5**. That opens the Spanish quote, its English translation and the BOE link. It also has **Ask for this instead** with **Copy** and an ES/EN switch.
- **One clause, several findings:** the margin shows one badge per rule, stacked and ordered by severity. Where findings mark the same words, the underline takes the colour of the most severe and shows a visible count mark ("2"). Opening it shows every explanation. A single colour is never shown without signalling that there's more.
- Opening a note scrolls the sheet to its clause, and the highlight pulses once. Hovering or focusing a highlight brings its note into focus. J/K move between findings, and Enter opens the law quote.
- Acceptance (trap sample):
  - [ ] It shows 10 not enforceable, 2 worth checking and 6 fine, matching the hand-made expected results for that contract.
  - [ ] Clause 5 (two-month deposit + four-month bank guarantee + late, interest-free return) shows its three findings as stacked badges, with not enforceable first. Opening it shows each finding.
  - [ ] When two findings mark the same words, the underline takes the most severe colour and shows the count mark.
  - [ ] Every note has its article and a working BOE link.

### Money Line
- It appears only when the contract's own numbers support it. Example for the trap sample: "At signing this contract ties up €11,741.50 (cash plus a bank guarantee). The legal maximum is €4,600." It also states the difference: €7,141.50 more than the law allows.
- Acceptance:
  - [ ] The trap sample shows exactly €11,741.50, €4,600 and €7,141.50.
  - [ ] The fair sample shows no money line.

### Write to My Landlord
- It's a polite message in Spanish, with an ES/EN switch so the tenant can read what they send. It lists each not-enforceable clause with its article and what is asked for instead. It's built from the rules' fixed sentences (template), with no AI writing.
- Acceptance:
  - [ ] For the trap sample, the message lists all 10 not-enforceable findings with their articles.
  - [ ] **Copy** puts it on the clipboard and shows "Copied".
  - [ ] When nothing is not enforceable, the button doesn't appear.

### Notices
- **Disclaimer**, under the summary and in the footer: "Fair Lease is an information tool, not legal advice. It checks your contract against a small set of rules from Spanish law (LAU, as of {law version date}) and shows you the exact article. For a decision that matters, talk to a tenants' union, your city's consumer office or a lawyer."
- **Free help in Madrid:** SAVMadrid, the city's free housing advice service run with the Madrid Bar (ICAM). Appointments on 900 814 815, Mon/Wed/Fri 9:00-14:00.
- **Law version:** "Rules checked against the BOE consolidated text of 7 Oct 2026. The 8 Oct 2026 changes still need a vote in Congress."
- **Not in Madrid:** "These rules are national, but Madrid-specific notes (no rent-cap zones) may not apply to your city."

## States and Boundaries

- **First use:** the start screen with the empty box, **Check** disabled, and three samples one tap away.
- **Checking:** real steps only, with no fake progress bar.
- **Clean contract:** a clear green state, "No problems found in the {n} rules we check", plus the **Fine** notes, any **Your right** notes and the disclaimer. It proves the app isn't alarmist.
- **Doesn't look like a rental contract** (including text that isn't Spanish): "This doesn't look like a Spanish rental contract. Paste the Spanish original, or try a sample." No result is shown.
- **Live analysis unavailable** (AI error, no credit, or the daily limit is reached): a message with the next step, "Live checks are paused right now. The samples still work.", and the samples keep working.
- **Quotes not found:** hidden, with a count (see `Quote Check`).
- **Edge dates:** no date, the 1-2 Oct 2026 window, or before 2019 (see `Law Version and Timeline`).
- **Persistence:** none. Nothing is stored. Reloading or **Check another contract** clears everything.
- **Privacy & Terms page:** the contract isn't stored or logged; personal data is removed in the browser before analysis; live checks send the anonymised text to Anthropic's API; it's not legal advice; the rules are public in the repo.

## Product Decisions

- **Paste only, no PDF**, to keep the proof of concept small. The PDF upload is the first thing to add, and the first thing dropped if time is short.
- **The AI never decides.** It extracts and quotes; code verifies the quotes, and fixed rules give the verdict. The trust argument is the kernel.
- **The law version follows the signing date.** A missing date means today's law, said in one line, and the tenant can pick a date to compare. Drafts before signing are the main use, so a missing date is normal, not an error.
- **Clauses with several findings:** stacked badges ordered by severity; the most severe colour in the text with a count mark; all explanations on open. One colour never hides a second warning.
- **Mobile:** a bottom sheet over the annotated text; desktop: the margin. The contract stays the main object on both.
- **Samples use a recorded extraction, and the rules run for real**, so the demo is instant, free and never fakes the kernel.
- **No accounts, no storage**, so judges and tenants get in at once and privacy is simple.
- **The landlord message is a template, not AI**, so nothing is invented.
- **Interface in English. The law quote stays in Spanish with an English translation**, because the users don't read Spanish legal language but the landlord does.
- **Assumption (agent):** the paste box sits on the start screen instead of a separate input screen, to save a step for first-time visitors and judges.
- **Assumption (agent):** the landlord message gets the same ES/EN switch as "Ask for this instead", so the tenant can read what they send.
- **Assumption (agent):** "too short" means under about 300 characters.

## What We're Building

1. A start screen that says what it does and for whom, with paste input, validation and three one-click samples.
2. Personal-data removal in the browser, with a count.
3. Live AI extraction of contract facts and quoted clauses, with no verdicts.
4. A quote check that drops anything not literally in the text and reports the count.
5. A rules engine with the three law versions picked from the signing date (no-date, edge-date and out-of-scope handling included) and the hand-checked priority rules plus every rule the three samples need.
6. The result screen: annotated sheet, verdict highlights (including multi-finding clauses), margin notes or bottom sheet, counts, money line, law timeline, notices, and the clean-contract state.
7. Write to my landlord, plus Copy.
8. Footer, Privacy & Terms page, own icon and title.
9. A live public deployment, with a size limit and a daily cap on live checks.

If time runs short, drop the Oct 2026 reform rules (and their sample) first, as agreed in scope.

## Deferred From the POC

- **PDF upload** (a PDF with a text layer, read in the browser). It's nicer in the video, but pasting proves the kernel.
- **The remaining hand-checked rules outside the priority set:** "contract ends if the flat is sold", the late-handover penalty, "all clauses were negotiated" boilerplate, all legal costs on the tenant. They're worth adding next, but none of the samples needs them.
- **Changing the signing date on a contract that has one.** Only the no-date case gets the date picker now.

## Possible Later Enhancements

- Room rentals and student residences, which follow different rules.
- Regions with their own civil law (Catalonia).
- A fully Spanish interface.
- Alerts when the law changes, e.g. after the Congress vote on the Oct 2026 reform.
- Sharing a result.

## Non-Goals

- **Accounts or saved history.** Nothing to protect, nothing to sign up for.
- **Storing contracts or logging their text.** Privacy.
- **OCR of scanned PDFs.** Too big; paste instead.
- **Rent caps for stressed zones, or judging whether the rent itself is fair.** Madrid has no declared zones and no cap applies.
- **A fairness score.** No legal basis; we count clauses and euros.
- **A chatbot or free-form questions.** The app does one thing end to end.
- **Legal advice, or posing as a lawyer.** It's an information tool with the article and the source.
- **Flagging a missing rental-registry number.** The Supreme Court annulled that registry.

## Open Questions

- None blocks `4-spec`. The exact rule count {n} and the wording of each rule's texts come from the rules table built during `5-build`, citing the BOE.
