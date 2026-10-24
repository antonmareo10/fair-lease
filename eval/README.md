# Fair Lease vs the model alone

Is Fair Lease just "ask the AI"? This folder measures it. The same model reads the same three sample contracts twice: once through the real Fair Lease pipeline, once with the question a person would type into any assistant. Both are scored against the hand-made expected results (GOLD) clause by clause. Measured on 24 Oct 2026, three runs per configuration, $0.95 in total.

## Result

Three runs of each configuration on the three contracts (41 GOLD rows). Cells are the mean, with the lowest and highest run in brackets when they differ.

| | Fair Lease (Sonnet 5.5 + rules + quote check) | Sonnet 5.5 alone |
| --- | --- | --- |
| Verdict matches GOLD (of 41 rows) | 40 | 29.3 (29-30) |
| Not-enforceable clauses found (of 15) | 15 | 9.7 (9-10) |
| "Worth checking" clauses found (of 2) | 2 | 0 |
| Problem clauses flagged at all, any severity (of 17) | 17 | 14.3 (14-15) |
| Fine clauses left alone (of 24) | 23 | 19.7 (19-20) |
| Fine clauses wrongly called not enforceable | 1 | 1 |
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
| 02 Limpio 2024 (of 15) | 14 | 12.3 (11-13) |
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

**Where Fair Lease is wrong.** It misses one row of 41, the same one in all three runs: on the fair 2024 contract the landlord's "need" clause (art. 9.3) is called not enforceable. Sonnet adds the signal `landlord_can_terminate` next to the three correct "need" signals, and rule FL-06 treats that signal as decisive. The model alone makes the same mistake on that clause in all three runs. This is a real false alarm on a clean contract when a contract is read live (the shipped samples use a recorded extraction). It is not fixed in this commit.

## Read this before quoting the table

- **GOLD and the rules share an author.** GOLD was written on 21 Oct 2026, before the code, and the rules were then built to meet it (the test suite asserts GOLD on a hand-made extraction). So Fair Lease scoring 40 of 41 mostly shows that the live model's reading survives the pipeline and reproduces the reading we hand-checked against the BOE. It does not prove that this reading is the only defensible one. Rows where the law is debatable, such as the two-month deposit marked "worth checking" or how FL-02 counts the extra deposit month toward the €3,450, are strict on the model alone.
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

With the stored results `npm run eval` makes no calls. A fresh run of everything at three runs each would cost about $1.6, mostly the Opus rows. The script stops making calls at a hard cap ($0.95 by default) and fills the Fair Lease and Sonnet rows first, so by default the Opus rows end up partial, as they did here. `--configs fair-lease-sonnet,alone-sonnet` is the $0.76 run. `npm test` covers the scoring itself and checks that the engine, given the hand-made extraction, scores 100% against `gold.json`.

Files: [`gold.json`](gold.json) (expected results), [`../scripts/eval.mts`](../scripts/eval.mts) (runner), [`../scripts/eval/`](../scripts/eval) (prompt, matching, scoring, report), [`results/`](results) (raw runs, summary, per-row matrix, table).
