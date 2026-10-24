---
doc: scope
status: approved
---

# Fair Lease

Paste your Madrid rental contract and see which clauses Spanish law doesn't allow. Each one is marked on your own text with the exact article, a plain-English explanation and what to ask for instead.

## The Unique Kernel
The AI reads and quotes; it never decides. Code checks that every quote is literally in your contract. Then public rules, hand-checked against the LAU in the BOE, give the verdict using the version of the law that applied on the day the contract was signed. Every flag is pinned to the exact words of your contract, with the article next to it.

## Who It's For
Someone about to rent a flat in Madrid, especially a young person or a student from abroad who doesn't read Spanish legal language. A contract has just arrived and they need to know, before signing, what they can push back on.
What they do today: sign without knowing which clauses are void. The alternatives cost money or time: a paid review (LexiRent's full report is €7.99, a lawyer consultation around €49.90), a free legal-aid slot at fixed weekday hours (ICAM), or pasting the contract into a general chatbot, which can invent articles.

## The Core Loop
They open the site, with no account, and paste the contract or tap a sample. The analysis steps light up as they really happen: reading clauses, picking the law version from the signing date, applying the rules, verifying the quotes. Then the contract lights up clause by clause, with a margin note for each finding: the verdict, a plain-English line, the article (Spanish quote, translation and BOE link), the euros involved when the contract gives the numbers, and an "Ask for this instead" text to copy.
It's a one-moment tool. You use it when a contract arrives, and again on the landlord's revised version or the next flat's contract.

## Inspiration & Identity
- **Your contract, annotated in the margin by a friend who knows the law.** A paper sheet with the contract set in a reading serif. Problem clauses get highlighted in the colour of their verdict, and the notes sit in the margin. No dashboard, no chat, no scare tone: red only where the law says so, and green gets shown too.
- The signature element: a law timeline (Mar 2019 · May 2023 · Oct 2026) with a marker on the signing date.
- Avoid the "paper + yellow highlighter" look another entry already uses.
- Trust from the first second: in 2-3 seconds the first screen says what it does and who it's for. The samples work in one click with no account. There's a footer, a short privacy page and "not legal advice".
- References: LAU consolidated text https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003 · Spain's consumer ministry list of the six most common abusive rental clauses (22 May 2026) https://www.dsca.gob.es/es/comunicacion/notas-prensa/consumo-informa-principales-clausulas-abusivas-detectadas-contratos · Existing paid tools to stand apart from: https://www.lexirent.es/ · https://eslojusto.es/alquiler/

## Why This Matters to the Learner
- Learning intention from `1-start`: making what an AI says checkable. "It only extracts and quotes, the code checks the quote exists in the text, and fixed rules decide."
- Personal stake: no personal anecdote. The reason is the problem itself: people sign without understanding clauses the law doesn't allow, and students from abroad can't read Spanish legal language. Add to that what he wants to learn by building it.

## What "Working" Looks Like
On the live site, with no account:
1. Tap **"A contract full of traps (2025)"**. The sheet lights up: 10 not enforceable · 2 worth checking · 6 fine, matching the hand-made expected results. The money line comes only from the contract's own figures: at signing it ties up €11,741.50, and the legal maximum is €4,600. That's €7,141.50 more than the law allows.
2. Click the bank-guarantee note. It shows LAU art. 36.5 quoted, translated and linked to the BOE, then you copy "Ask for this instead".
3. Tap **"Signed after the Oct 2026 reform"**. The timeline marker slides to Oct 2026, and the same purchase-right waiver that was fine in the 2025 contract now shows red, tagged "pending Congress vote".
4. Tap **"A fair contract (2024)"**. No problems found, so it isn't alarmist.
5. Paste your own contract: same result, analysed live.

The "oh, that's cool" beat is your own contract lighting up in your own words, with a euro figure computed from your own clauses.
The finish line has two parts. In tests, the rules engine reproduces the expected verdicts for all three sample contracts. The deployed site shows the five steps above.

## The POC Boundary
- **Paste text.** Before analysis, the browser removes ID numbers, IBANs, phone numbers and emails and says how many it removed.
- **AI extraction.** Contract facts plus clauses with literal quotes, topics and numbers. No verdicts.
- **Quote check.** A quote that isn't literally in the text is dropped, and the app says how many were hidden.
- **Rules engine in code.** It picks the law version from the signing date (Mar 2019 – May 2023, May 2023 – 7 Oct 2026, from 8 Oct 2026 tagged "pending Congress vote"). Then it runs the hand-checked rules: the priority set plus every rule the three samples need.
- **Result screen.** Annotated sheet, margin notes, counts, money line, law timeline, a clear "no problems found" state, the not-legal-advice notice, and a "Write to my landlord" message assembled from the rules' own sentences (template, no AI).
- **Three one-click samples** with a recorded extraction. The rules engine runs on them for real every time, so the demo never waits and never spends API credit.
- **Live deployment.** The API key stays server-side, with an input size limit and a daily cap on live analyses.
- If time runs short, drop in this order: PDF upload, then the Oct 2026 rules. The demo already leans on rules that hold under both versions of the law.

## Later
- Upload a PDF that has a text layer, read in the browser.
- The rest of the hand-checked rules outside the priority set (e.g. "the contract ends if the flat is sold", the late-handover penalty, "all clauses were negotiated" boilerplate, all legal costs on the tenant).
- Room rentals and student residences, regions with their own law (Catalonia), a fully Spanish interface, alerts when the law changes, sharing the result.

## Explicitly Cut
- **Accounts and login.** Judges and tenants get straight in, and there's nothing to keep.
- **Storing contracts** (database or logs of the text). The contract is analysed and forgotten.
- **OCR for scanned PDFs.** Too big for a proof of concept. Paste the text instead, with a clear message.
- **Rent caps for stressed zones.** Madrid has none declared, so applying them would be wrong.
- **A "fairness score".** It has no legal basis. Count clauses and computed euros instead.
- **A chatbot.** The app does one thing, end to end.
- **AI-written advice or letters.** Everything shown comes from fixed rule texts, so nothing is invented. It's not legal advice and doesn't pose as a lawyer.
- **Connecting users with lawyers.** Not needed to prove the kernel.

---
Context: the interview answers draw on legal research notes and fictional sample contracts prepared, with AI help, before this folder was created. No prior code.
