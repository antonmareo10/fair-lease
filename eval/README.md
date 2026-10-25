# Fair Lease vs the model alone

Is Fair Lease just "ask the AI"? This folder measures it. The same model reads the same contracts twice: once through the real Fair Lease pipeline, once with the question a person would type into any assistant. Both are scored clause by clause against expected results written by hand.

There are two sets. The **held-out set** (six contracts, 84 clauses, labelled and committed before any run) is the one to quote. The **samples set** (the three contracts the rules were built on, 41 clauses) came first and is below it. API cost of everything in this folder: $3.41.

## Held-out contracts (25 Oct 2026)

Six new fictional Madrid contracts, written to cover what the samples don't: a company landlord under the 2019 text, a fair contract full of clauses that feel harsh but are legal, the six abusive clauses Spain's consumer ministry listed on 22 May 2026, borderline clauses, a legitimate temporary contract for a master's student under the October 2026 reform, and a company landlord after the reform. 84 rows: 16 not enforceable, 9 worth checking, 59 fine.

Every row was labelled by hand from `LEGAL_RULES.md` (the rule notes checked against the BOE) and the contract's signing date, and committed in [94e242c](https://github.com/antonmareo10/fair-lease/commit/94e242c) before any model or engine had read the contracts. The labels follow the law, not the engine: four rows needed rules the engine did not have yet (FL-12, FL-20, FL-21, FL-22) and were labelled anyway. Contracts, labels and the reason for each row: [`holdout/`](holdout), [`holdout/LABELS.md`](holdout/LABELS.md).

### First run, as pre-registered

Three runs of each configuration, $1.42 ([`results-holdout/`](results-holdout)). Same settings as the samples set below.

| | Fair Lease (Sonnet 5.5 + rules + quote check) | Sonnet 5.5 alone |
| --- | --- | --- |
| Verdict matches the label (of 84 rows) | 75 | 69.7 (69-71) |
| Not-enforceable clauses found (of 16) | 12 | 12.0 (11-13) |
| "Worth checking" clauses found (of 9) | 5 | 5.0 (4-6) |
| Problem clauses flagged at all, any severity (of 25) | 17 | 22 |
| Fine clauses left alone (of 59) | 58 | 52.7 (52-54) |
| Fine clauses wrongly called not enforceable | 0 | 2.3 (2-3) |
| Fine clauses sent to review | 1 | 4.0 (3-5) |
| Right version of the law (of 6 contracts) | 6 | 3 |
| Euro figures right (of 7) | 7 | 5.0 (3-6) |
| Euros claimed on a fine clause | 0 | 1.3 (1-2) |
| Invented articles / quotes not in the contract | 0 / 0 | 0 / 0 |
| Cost per contract | $0.037 | $0.042 |

Fair Lease gave the same answer in all three runs. Its nine wrong rows, by name:

- **No rule for it (5):** "if the flat is sold the contract ends" (H1, FL-12); a late-handover penalty of three times the daily rent, with a company landlord and with a private one (H1 and H3, FL-20); "both parties declare every clause was negotiated" (H3, FL-21); all court and lawyer costs on the tenant whatever the outcome (H3, FL-22). The model alone caught all five, though it called the company-landlord penalty only "worth checking".
- **Rules with a gap (3):** a renewal fee after the October 2026 reform (H6) and an optional cleaning service (H5), both filed by the model under "other", which FL-03 never read; and a ban on leaving during the first twelve months (H6), for which FL-07 had no signal.
- **A false alarm (1):** a correct art. 9.3 clause (the landlord's mother may need the flat) sent to review in H2, because Sonnet quoted only its second sentence and FL-06 read only the quote.

The model alone found more problem clauses (22 of 25) but was wrong in other ways, the same ones as on the samples: it applied an older law to three of the six contracts in every run (the 2019 text to a 2024 contract, and the pre-reform text to both October 2026 contracts), called a company's legal two-month guarantee not enforceable in all three runs and claimed €1,600 to €3,200 "over the limit" on that contract, called the extra guarantee that is over the limit in H3 fine in all three runs, sent the official-index rent update to review in all three, and called the Madrid waste charge not enforceable where the law is unsettled.

### What I changed, and a fresh run

After reading those nine rows I made these changes, all from `LEGAL_RULES.md`:

- added FL-12, FL-20, FL-21 and FL-22, with their BOE texts (LAU art. 14, TRLGDCU arts. 85.6 and 82.2, LEC art. 394.1);
- five new signals for the model to tick (`sale_ends_lease`, `penalty_three_times_daily_rent`, `declares_individual_negotiation`, `all_legal_costs_tenant`, `no_exit_period`) and one for fees (`contract_fee`), plus two sentences in the prompt on which topic a renewal fee or an exit rule belongs to;
- FL-03 reads fees whatever topic they were given, and since the reform treats an "optional" service as worth checking; FL-07 flags a lock-in longer than six months (one in a valid temporary contract); FL-06 reads the clause's whole paragraph, taken from the contract, not only the quote.

Then a fresh run of Fair Lease (new extractions with the new prompt, three runs, $0.67, [`results-holdout-v2/`](results-holdout-v2)): **84 of 84 rows in every run**, 16 of 16 not enforceable, 9 of 9 worth checking, 59 of 59 fine clauses left alone, the right law for all six contracts and all 7 euro figures. It added one note the labels don't ask for: "worth checking" (FL-16) on the H3 deposit clause that the labels file under FL-07 as not enforceable. The same prompt and rules on the three original samples, also fresh (three runs, $0.37, [`results-v2/`](results-v2)): 41 of 41.

The first run's files are kept as measured at commit 1748c0b. Rescoring those same stored extractions with today's rules (`npm run eval:score -- --set holdout`, which rewrites `results-holdout/`) gives 77 of 84: the FL-06 and optional-service fixes reach the old extractions, the other seven rows need the new signals, which only a new extraction has. `npm run eval:score -- --set holdout --out eval/results-holdout-v2` recomputes the fresh run.

**Read this before quoting it.** The blind number is the first run: 75 of 84 for Fair Lease, 69.7 for the model alone. The 84 of 84 came after I fixed what that run showed, on the same contracts, so it shows that the fixes work, not how Fair Lease does on contracts it has never seen. The labels and the rules still share an author, and six contracts is a small set.

## Samples set (24 Oct 2026)

The same comparison on the three sample contracts the rules were built on. Measured on 24 Oct 2026, three runs per configuration, $0.95 in total. The first round found one miss in Fair Lease (rule FL-06); it was fixed afterwards and the Fair Lease column below is the result with the fix (see "The one miss, and the fix").

## Result

Three runs of each configuration on the three contracts (41 GOLD rows). Cells are the mean, with the lowest and highest run in brackets when they differ.

| | Fair Lease (Sonnet 5.5 + rules + quote check) | Sonnet 5.5 alone |
| --- | --- | --- |
| Verdict matches GOLD (of 41 rows) | 41 | 29.3 (29-30) |
| Not-enforceable clauses found (of 15) | 15 | 9.7 (9-10) |
| "Worth checking" clauses found (of 2) | 2 | 0 |
| Problem clauses flagged at all, any severity (of 17) | 17 | 14.3 (14-15) |
| Fine clauses left alone (of 24) | 24 | 19.7 (19-20) |
| Fine clauses wrongly called not enforceable | 0 | 1 |
| Fine clauses sent to review | 0 | 3.3 (3-4) |
| Flags on passages GOLD does not label | 0 | 1.0 (0-2) |
| Right flags that cite an accepted article | 17 of 17 | 14.3 (14-15) of 14.3 (14-15) |
| LAU articles cited / not in the LAU / real but wrong for that clause | 45.7 (45-46) / 0 / 0 | 72.3 (62-80) / 0 / 3.7 (3-4) |
| Quotes shown that are not literally in the contract | 0 of 44.7 (44-45) | 0 of 51.7 (49-54) |
| Right version of the law (of 3 contracts) | 3 | 1.3 (1-2) |
| Euro figures right (of 4) | 4 | 1.3 (1-2) |
| Euros claimed on a fine clause | 0 | 0 |
| Cost per contract | $0.040 | $0.044 |

| Rows matching GOLD | Fair Lease (Sonnet 5.5 + rules + quote check) | Sonnet 5.5 alone |
| --- | --- | --- |
| 01 Trampas 2025 (of 18) | 18 | 13.7 (13-15) |
| 02 Limpio 2024 (of 15) | 15 | 12.3 (11-13) |
| 03 Nueva ley oct 2026 (of 8) | 8 | 3.3 (3-4) |

Opus 5.5 alone costs about twice as much (about $0.10 a contract), so it did not fit the budget in full: one run on two contracts, compared with the others on exactly those contracts and that run.

| | Fair Lease (Sonnet 5.5 + rules + quote check) | Sonnet 5.5 alone | Opus 5.5 alone |
| --- | --- | --- | --- |
| Verdict matches GOLD (of 26 rows) | 26 | 17 | 16 |
| Not-enforceable clauses found (of 15) | 15 | 10 | 9 |
| "Worth checking" clauses found (of 2) | 2 | 0 | 0 |
| Problem clauses flagged at all, any severity (of 17) | 17 | 15 | 15 |
| Fine clauses left alone (of 9) | 9 | 7 | 7 |
| Fine clauses wrongly called not enforceable | 0 | 0 | 1 |
| Fine clauses sent to review | 0 | 2 | 1 |
| Right version of the law (of 2 contracts) | 2 | 0 | 1 |
| Euro figures right (of 4) | 4 | 1 | 3 |
| Cost per contract | $0.039 | $0.046 | $0.095 |

The full tables are in [`results/table.md`](results/table.md), the answer of each configuration to each GOLD row in [`results/rows.json`](results/rows.json), and every raw model reply in [`results/runs.json`](results/runs.json).

## What the numbers say

- **The model alone is a good first reader and a poor judge.** It flags 14 of the 17 problem clauses at some severity, and it never invented a quote or an article: every quote it showed is literally in the contract and none of its 217 LAU citations points to an article that does not exist. Where it goes wrong is the verdict and the law.
- **Verdicts.** It calls 9.7 of the 15 not-enforceable clauses "not enforceable", and it hedges or misses the rest. It also sends 3.3 fine clauses per run to review (mostly the ban on pets, which it flagged in 8 of its 9 readings) and calls the two "worth checking" clauses of the traps contract (a two-month deposit, a three-month return) not enforceable in 5 of 6 readings. Fair Lease gives the same verdicts in all three runs.
- **The date of the law.** For the October 2026 contract the model applied the May 2023 text in all four of its runs (three Sonnet, one Opus). It gets 3.3 of the 8 rows, and misses the ones that only the new law makes illegal: the IBI charged to the tenant, the one-month-per-year exit fee, and the mandatory default insurance (it only says "review"). For the 2025 contract it picked the 2019 text in two of three runs. Fair Lease reads the signing date and chooses the version in code.
- **Euros.** Sonnet alone gave the number a tenant would remember (€7,141.50 over the limit) in none of its three runs (it said €2,541.50, €5,991.50 and €2,541.50). Opus alone got it. Fair Lease computes it from the clauses' own numbers.
- **Quote verification caught nothing here.** The checker dropped 0 of the 47 quotes Sonnet proposed in each run, and the model alone copied 0 wrong quotes. On three short contracts it is insurance, not a measured gain. Its value is that a bad quote could never reach the screen.
- **A bigger model does not change the picture much.** Opus 5.5 alone matched 16 of the 26 rows on the two contracts where Sonnet alone matched 17, and was right on the euro total and on the law version for the 2025 contract.

**The one miss, and the fix.** In the first round Fair Lease missed one row of 41, the same one in all three runs: on the clean 2024 contract the landlord's "need" clause (art. 9.3) was called not enforceable. Sonnet ticked a stray signal, `landlord_can_terminate`, next to the three correct "need" signals, and rule FL-06 let that signal decide on its own. The model alone made the same mistake on that clause in all three runs. I then changed FL-06 so that no signal decides alone: when that signal appears together with the 9.3 signals, the rule reads the quoted words for what article 9.3 asks (a need to live there for the landlord or a close relative, only after the first year, two months' notice). If the quote shows them and no other way out for the landlord (a sale, "at any time", "without a reason"), the clause is fine; if it shows another way out, it is not enforceable; if it does not show the conditions, it becomes "worth checking". The real extraction that caused the false alarm is saved as a test fixture ([`scripts/fixtures/fair-2024.sonnet-live.extraction.json`](../scripts/fixtures/fair-2024.sonnet-live.extraction.json), [`tests/fl06-signals.test.ts`](../tests/fl06-signals.test.ts)). The rules are plain code, so `npm run eval:score` re-ran them on the three stored Sonnet extractions of the clean contract and gives 41 of 41 in every run, and one fresh live pass on the clean contract through the real pipeline ($0.04, `npm run try-live -- fair-2024`) came back with no clause not enforceable and none worth checking. The fix was made after seeing the failure, on the same data, so the 41 is not a blind result.

## Read this before quoting the table

- **GOLD and the rules share an author.** GOLD was written on 21 Oct 2026, before the code, and the rules were then built to meet it (the test suite asserts GOLD on a hand-made extraction). So Fair Lease scoring 41 of 41 (after the FL-06 fix described above, made on these same extractions) mostly shows that the live model's reading survives the pipeline and reproduces the reading we hand-checked against the BOE. It does not prove that this reading is the only defensible one. Rows where the law is debatable, such as the two-month deposit marked "worth checking" or how FL-02 counts the extra deposit month toward the €3,450, are strict on the model alone.
- **The model-alone prompt has structure.** To score it automatically, the prompt asks for one entry per point, with the clause heading, a literal quote, a three-way verdict, the articles, the euros over the limit and the version of the law. The question itself is the plain one ("revisa este contrato de alquiler español firmado el ... y dime qué cláusulas no son exigibles según la LAU, con el artículo"). The prompt is in [`scripts/eval/model-alone.ts`](../scripts/eval/model-alone.ts). It was written once and not tuned on the results.
- **Same settings as the product.** Both configurations use Sonnet 5.5 with output effort `low`, structured output and the refusal fallbacks of `lib/claude.ts`. The model alone at higher effort was not tested.
- **A small sample.** Three fictional contracts, 41 rows. Differences of one row between runs are noise; the gaps in the table are not.
- **Opus is partial.** One run on two contracts, because it did not fit under $1.
- **Silence counts as "not flagged".** If a configuration never mentions a GOLD row, it is scored as having called it fine. That is a miss on a problem clause and a correct answer on a fine one.

## How a row is scored

A GOLD row is one line of `demo_contracts/GOLD.md` (a clause, or part of one). [`gold.json`](gold.json) lists 41 rows: 15 not enforceable, 2 worth checking, 24 fine. Each row points at the literal text of the clause in the contract and lists the articles a lawyer would accept for it (art. 6 LAU, the nullity of terms against the tenant, is accepted everywhere).

1. Each answer from a configuration is reduced to entries: a verdict about a passage, with the articles it cites and the euros it says are over the limit. Fair Lease entries are its findings. Model-alone entries are the objects it returns.
2. An entry belongs to a GOLD row when its quote overlaps the row's text (at least half of the shorter span). If the quote is not in the contract at all, the clause number is used, but only when it points at a single row. Fair Lease also has to agree on the rule id.
3. A row is right when the verdict is the same (not enforceable, worth checking, fine). Several entries on one row: the closest one wins.
4. An article is accepted if its number is in the row's list; the sub-section is ignored. A LAU article is "not in the LAU" if it is not one of the 40 articles plus 9 bis and 21 bis of the consolidated BOE text (checked on 24 Oct 2026). A quote is "not literally in the contract" if the same checker the app uses (`lib/quotes.ts`) cannot find it.
5. The version of the law is right when the date the tool names falls in the same legal period as the signing date (before 26 May 2023, up to 7 Oct 2026, from 8 Oct 2026). Fair Lease's period comes from the signing date it extracted.
6. Euros: three clauses of the traps contract (€2,300 prepayment, €3,450 guarantees, €1,391.50 agency fee) and the €7,141.50 total, with a tolerance of €1. The early-exit amount of FL-07 is not scored because GOLD itself flags it as debatable.

## Run it again

```bash
npm install
# .env.local with ANTHROPIC_API_KEY, as for the app
npm run eval                      # makes the missing calls (3 runs each), scores, writes eval/results/
npm run eval:score                # recomputes every number from eval/results/runs.json, no API calls
npm run eval -- --fresh --cap 0.9 # ignores stored runs and calls again, stopping new calls at $0.90
npm run eval -- --configs alone-opus --runs 1 --contracts traps-2025,reform-oct-2026
```

With the stored results `npm run eval` makes no calls. A fresh run of everything at three runs each would cost about $1.6, mostly the Opus rows. The script stops making calls at a hard cap ($0.95 by default) and fills the Fair Lease and Sonnet rows first, so by default the Opus rows end up partial, as they did here. `--configs fair-lease-sonnet,alone-sonnet` is the $0.76 run. The Fair Lease column is recomputed with the rules in the repo from the Sonnet extractions stored in `runs.json`, so it reflects the rules at this commit; the extractions themselves are what the model returned. `npm test` covers the scoring itself and checks that the engine, given the hand-made extraction, scores 100% against `gold.json`.

Files: [`gold.json`](gold.json) (expected results), [`../tests/fl06-signals.test.ts`](../tests/fl06-signals.test.ts) (the FL-06 case), [`../scripts/eval.mts`](../scripts/eval.mts) (runner), [`../scripts/eval/`](../scripts/eval) (prompt, matching, scoring, report), [`results/`](results) (raw runs, summary, per-row matrix, table).
