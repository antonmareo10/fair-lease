# Held-out contracts: hand labels

Six fictional Madrid rental contracts, written and labelled by the agent on 25 Oct 2026 from `LEGAL_RULES.md` (the rule notes checked against the BOE on 21 Oct 2026) and each contract's signing date, before any model or engine run on them. The commit that adds this folder is the pre-registration: the labels were fixed before the first measurement.

- Names, IDs, companies and addresses are invented. IDs use the `0000000x` pattern, so the app's anonymiser replaces them before anything is sent.
- The labels follow the law, not the engine. The engine at that commit has no rules for FL-12 (sale ends the lease), FL-20 (late-handover penalty), FL-21 ("negotiated individually") or FL-22 (all court costs on the tenant). Those rows are labelled anyway, so a miss shows up as a miss.
- Every clause with an obligation is labelled, fine ones included, so false alarms can be counted. Clauses with no obligation (object, applicable law, signatures) are not rows.
- Verdicts are the app's three: not enforceable, worth checking, fine. "Worth checking" is used where `LEGAL_RULES.md` says CHECK: the answer depends on a fact the contract can't show, or the case law is not settled.
- `quotes` in `gold.json` are the literal passages that anchor each row. `tests/eval-holdout.test.ts` checks that each one is in the anonymised text, inside the clause the row names, and that no two rows share a passage.
- Euro amounts follow `GOLD.md`'s method: money asked at signing (first month or rent in advance, deposit, extra guarantees, fees) minus the legal maximum (first month, one month's deposit, the guarantee cap, and fees only where the law allows them).

## Totals

| Contract | Signed | Law | Landlord | Rows | Not enforceable | Worth checking | Fine | Over at signing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H1 Empresa 2021 | 14 Sep 2021 | A (2019 text) | company | 14 | 3 | 0 | 11 | €1,452 |
| H2 Justo 2024 | 2 Sep 2024 | B (May 2023 text) | private | 19 | 0 | 0 | 19 | €0 |
| H3 Consumo 2025 | 7 Apr 2025 | B | private | 14 | 3 | 5 | 6 | €1,400 |
| H4 Dudoso 2025 | 2 Jun 2025 | B | private | 13 | 4 | 2 | 7 | €0 |
| H5 Temporal con causa oct 2026 | 20 Oct 2026 | C (8 Oct 2026 reform) | company | 12 | 2 | 1 | 9 | €250 |
| H6 Empresa oct 2026 | 15 Oct 2026 | C | company | 12 | 4 | 1 | 7 | €0 |
| Total | | | | 84 | 16 | 9 | 59 | 7 euro figures |

What each contract is for:

- H1: the 2019 law with a company landlord. The agency fee is not enforceable only because the landlord is a company (in 2021 a private landlord could still charge it). Seven-year extensions, a CPI update that was legal then, "a sale ends the lease" and a penalty of three times the daily rent for late handover.
- H2: a fair contract with clauses that feel harsh but are legal (no smoking, contents insurance, pets with permission, IBI passed on with its yearly amount, the landlord's mother's need under art. 9.3). Every row is fine: it measures false alarms.
- H3: the six clauses Spain's consumer ministry flagged on 22 May 2026, with a private landlord, plus cash-only rent.
- H4: problems that need a second look: a landlord exit "to sell", a fixed 5% rise, parents as guarantors with no cap, IBI without an amount, the Madrid waste charge, and an exit penalty that is too high.
- H5: a legitimate temporary contract under the October 2026 reform (a master's student with the cause written in), with a check-in fee and IBI that only the new law forbids, and an optional cleaning service.
- H6: a company landlord after the reform: no extensions past three years, a 9.3-style "need" clause that only private landlords can use, a renewal fee, a twelve-month lock-in and a two-month deposit return.

## Judgment calls

1. H3 QUINTA (deposit returned only if the whole term is completed) is labelled FL-07 not enforceable, not FL-16 worth checking. `LEGAL_RULES.md` maps Consumo's clause 5 to "FL-07/FL-16"; its FL-07 section says the deposit can't work as a penalty for leaving, which art. 11 regulates, and keeping a 2,100 € deposit always exceeds art. 11's one month per year left. A tool that calls it "worth checking" under FL-16 is scored wrong on this row.
2. H5 SEXTA (cleaning service the tenant asked for in writing, told it is optional and its cost) is labelled worth checking, following `LEGAL_RULES.md` FL-03 ("si la cláusula dice opcional → CHECK"): art. 20.2 (C) allows it only if those facts are true, and the contract's own sentence can't prove them. This is the most debatable row; a reader could argue "fine". Drop it if it looks like a coin flip.
3. H1 CUARTA (yearly CPI update, signed 2021) is labelled fine: `LEGAL_RULES.md` §4 lists the CPI as within the limit for 2019-text contracts. Since 8 Oct 2026 the DT 4ª and DF 6ª caps (pending a vote) limit the next updates; they don't void the clause, and the app shows them as a "your right" note.
4. H4 QUINTA (fixed 5% a year "con independencia de la evolución de cualquier índice") is labelled not enforceable: for contracts signed after 26 May 2023 art. 18 caps updates at the reference index (IRAV, 2.54% in Sept 2026), and the clause expressly ignores it. It would only be within the cap if the IRAV reached 5%.
5. H6 OCTAVA labels only the first sentence (no leaving in the first twelve months, not enforceable under art. 11 and art. 6; `LEGAL_RULES.md` FL-07 lists "prohibición de irse después de los 6 meses" as a trigger). The second sentence (after that, 30 days' notice, no compensation) is part of the same obligation and is not a separate row.
6. Late-handover penalties (FL-20): H1 (company) is not enforceable and H3 (private landlord) is worth checking, exactly as `LEGAL_RULES.md` FL-20 sets it. Both use "el triple de la renta diaria", the ratio Consumo's note names.
7. Accepted articles beyond `LEGAL_RULES.md`: TRLGDCU 83 (abusive terms are void) on the H1 penalty and CC 1154 (a judge moderates a penalty) on the H3 penalty. They only make article scoring more lenient; they don't change any verdict.
8. Euro figures: only amounts that follow without interpretation are scored (the fees in H1, H3 and H5, the guarantee excess in H3, and the three totals). The H6 renewal fee is not scored as a euro figure because it is charged at each renewal, so "how much over" depends on how many renewals happen.
9. Out of scope on purpose: room rentals, contracts without a signing date, contracts signed on 1-2 Oct 2026 (the repealed RDL 26/2026), and anything that depends on a rent index value nobody knows yet.

## Rows by contract

### H1 Empresa 2021 (`ho-2021-company`)

Signed 14 de septiembre de 2021 → regime A (law in force from 2019-03-06). Landlord: a company. 14 rows: 3 not enforceable, 0 worth checking, 11 fine.

Money at signing: At signing: first month 1,200 + deposit 1,200 + extra guarantee 2,400 + agency fee 1,452 = 6,252. Legal maximum: 1,200 + 1,200 + 2 x 1,200 = 4,800 (regime A, company landlord, so the agency fee is not allowed). Over: 1,452.

| Clause | Rule | Verdict | Accepted articles | Why |
| --- | --- | --- | --- | --- |
| SEGUNDA | FL-05 | Fine | - | Repeats art. 9.1 LAU: yearly extensions up to seven years because the landlord is a company. FL-05 only flags a waiver. |
| TERCERA | FL-15 | Fine | - | Payment by bank transfer. FL-15 only questions cash-only payment. |
| TERCERA | FL-04 | Fine | - | FL-04 trap: paying the first month at signing is fine (art. 17.2 LAU caps advance rent at one month). |
| CUARTA | FL-08 | Fine | - | Regime A (signed 14 Sep 2021): art. 18.1 in the 2019 text caps the yearly update at the CPI, so a yearly CPI update is at the cap. LEGAL_RULES §4 lists 'actualización anual por el IRAV (o el IPC en contratos de A)' as legal. The 8 Oct 2026 caps (DT 4ª, DF 6ª) limit future updates; they do not void the clause. |
| QUINTA | FL-01 | Fine | - | Art. 36.1 LAU: the legal deposit is one month's rent. |
| QUINTA | FL-02 | Fine | - | Art. 36.5 LAU: extra guarantees up to two months for contracts of up to seven years with a company landlord. Two months is at the cap. |
| SEXTA | FL-03 | Not enforceable (€1,452 over) | LAU 20, LAU 6 | Regime A text of art. 20.1 LAU: 'Los gastos de gestión inmobiliaria y de formalización del contrato serán a cargo del arrendador, cuando este sea persona jurídica.' The landlord is an S.L. (LEGAL_RULES FL-03, regime A with a company). |
| SÉPTIMA | FL-09 | Fine | - | Art. 20.1 LAU: community fees can be passed on when the yearly amount is written (840 €). |
| SÉPTIMA | OK-UTILITIES | Fine | - | LEGAL_RULES §4: utilities with individual meters are the tenant's (art. 20.3). |
| OCTAVA | FL-12 | Not enforceable | LAU 14, LAU 6 | Art. 14 LAU: the buyer is subrogated for the first five years, seven if the previous landlord is a company; an agreed 'sale ends the lease' only binds the buyer after that period (LEGAL_RULES FL-12, regimes A B C). Leaving two months after a sale cannot be enforced in the first seven years. |
| NOVENA | FL-20 | Not enforceable | TRLGDCU 85, TRLGDCU 82, TRLGDCU 83, LAU 6 | TRLGDCU art. 85.6 (disproportionately high indemnity) and Consumo's note of 22 May 2026: courts treat a late-handover penalty of three times the daily rent as abusive. LEGAL_RULES FL-20: ratio >= 3 gives CHECK, and ILLEGAL when the landlord is a company (consumer contract). Ratio 3, landlord an S.L. |
| DÉCIMA | FL-11 | Fine | - | Mirrors art. 21.1 and 21.4 LAU (LEGAL_RULES §4). |
| DÉCIMA | OK-WORKS | Fine | - | LEGAL_RULES §4: works only with the landlord's written consent is what art. 23.1 says. |
| UNDÉCIMA | FL-07 | Fine | - | Art. 11 LAU (A/B): leaving after six months with 30 days' notice; no compensation is better than the law requires. |

### H2 Justo 2024 (`ho-2024-fair`)

Signed 2 de septiembre de 2024 → regime B (law in force from 2023-05-26). Landlord: a private person. 19 rows: 0 not enforceable, 0 worth checking, 19 fine.

Money at signing: At signing: first month 870 + deposit 870 = 1,740, under the legal maximum (870 + 870 + 2 x 870 = 3,480).

| Clause | Rule | Verdict | Accepted articles | Why |
| --- | --- | --- | --- | --- |
| SEGUNDA | FL-05 | Fine | - | Repeats art. 9.1 LAU (five years, private landlord). |
| TERCERA | FL-06 | Fine | - | Art. 9.3 LAU, all conditions present: private landlord, written from signing, a first-degree relative (his mother), only after the first year, two months' notice (LEGAL_RULES FL-06, §4). |
| CUARTA | FL-15 | Fine | - | Electronic payment, as art. 17.3 (2023 text) asks; paying in the first seven days is the legal default (LEGAL_RULES §4). |
| CUARTA | FL-04 | Fine | - | FL-04 trap: first month at signing is fine. |
| QUINTA | FL-08 | Fine | - | Yearly, on the anniversary, by the INE reference index (IRAV): LEGAL_RULES FL-08 trap 'actualización anual conforme al IRAV es OK'. |
| SEXTA | FL-01 | Fine | - | Art. 36.1 LAU: one month's deposit. |
| SÉPTIMA | FL-09 | Fine | - | Art. 20.1 LAU: yearly amount written (540 €). |
| SÉPTIMA | FL-10 | Fine | - | Regime B (signed 2 Sep 2024): art. 20.1 (2023 text) lets 'tributos' be passed on when written with the yearly amount (LEGAL_RULES FL-10: A/B with the amount gives OK). Banned only for contracts signed from 8 Oct 2026. |
| SÉPTIMA | OK-UTILITIES | Fine | - | LEGAL_RULES §4: metered utilities are the tenant's. |
| OCTAVA | FL-03 | Fine | - | Art. 20.1 LAU (2023 text): these fees are the landlord's, and the clause says so. |
| NOVENA | FL-11 | Fine | - | Mirrors art. 21.1 and 21.4 LAU. |
| DÉCIMA | FL-13 | Fine | - | LEGAL_RULES FL-13: visits by appointment, with consent, are fine. |
| UNDÉCIMA | OK-SMOKING | Fine | - | LEGAL_RULES §4: a smoking ban is a free agreement (art. 4.2 LAU). |
| DUODÉCIMA | OK-CONTENTS-INSURANCE | Fine | - | LEGAL_RULES §4: insurance for the tenant's own belongings is not rent-default insurance (interpretation marked I in LEGAL_RULES). |
| DECIMOTERCERA | OK-PETS | Fine | - | LEGAL_RULES §4: pets can be banned or need permission (art. 4.2). |
| DECIMOCUARTA | FL-07 | Fine | - | Art. 11 LAU (A/B), with no compensation at all. |
| DECIMOQUINTA | FL-16 | Fine | - | Art. 36.4 LAU: returned within a month of the keys, minus real debts or damage. |
| DECIMOSEXTA | OK-SUBLET | Fine | - | LEGAL_RULES §4: art. 8 LAU. |
| DECIMOSEXTA | OK-WORKS | Fine | - | LEGAL_RULES §4: art. 23.1 LAU. |

### H3 Consumo 2025 (`ho-2025-consumo`)

Signed 7 de abril de 2025 → regime B (law in force from 2023-05-26). Landlord: a private person. 14 rows: 3 not enforceable, 5 worth checking, 6 fine.

Money at signing: At signing: first month 1,050 + deposit 2,100 + extra guarantee 2,100 + agency fee 350 = 5,600. Legal maximum: 1,050 + 1,050 + 2 x 1,050 = 4,200. Over: 1,400 (1,050 of guarantees above the cap + the 350 € fee).

| Clause | Rule | Verdict | Accepted articles | Why |
| --- | --- | --- | --- | --- |
| SEGUNDA | FL-05 | Fine | - | Keeps the legal extensions of art. 9 LAU. |
| TERCERA | FL-15 | Worth checking | LAU 17 | Regime B: art. 17.3 LAU (2023 text) says payment is electronic; cash only exceptionally when a party has no bank account and asks for it. LEGAL_RULES FL-15: B/C gives CHECK. |
| TERCERA | FL-04 | Fine | - | First month at signing is fine. |
| CUARTA | FL-01 | Worth checking | LAU 36 | Art. 36.1 LAU: the deposit is one month. LEGAL_RULES FL-01: above one month gives CHECK and the excess counts as extra guarantee (Consumo's clause 2). |
| CUARTA | FL-02 | Not enforceable (€1,050 over) | LAU 36, LAU 6 | Art. 36.5 LAU: extra guarantees at most two months (contract up to five years, private landlord). Extra = 1 (deposit above one month) + 2 = 3 months, one month (1,050 €) over (LEGAL_RULES FL-02, same method as GOLD.md). |
| QUINTA | FL-07 | Not enforceable | LAU 11, LAU 36, LAU 10, LAU 6 | Consumo's clause 5 (deposit returned only if the whole term is completed). LEGAL_RULES FL-07 'Respaldo': the deposit cannot work as a penalty for leaving, which art. 11 regulates (Consumo cites arts. 6, 10 and 36). Under art. 11 (A/B) the most is one month per year left, prorated; keeping a 2,100 € deposit always exceeds it (leaving at month 6: at most 525 €). FL-07 trigger list includes 'perderá la fianza'. |
| SEXTA | FL-03 | Not enforceable (€350 over) | LAU 20, LAU 6 | Regime B: art. 20.1 LAU (2023 text): 'Los gastos de gestión inmobiliaria y los de formalización del contrato serán a cargo del arrendador.' LEGAL_RULES FL-03 trigger list includes 'estudio de solvencia' (Consumo's clause 1). |
| SÉPTIMA | FL-09 | Fine | - | Art. 20.1 LAU: yearly amount written. |
| SÉPTIMA | OK-UTILITIES | Fine | - | LEGAL_RULES §4. |
| OCTAVA | FL-20 | Worth checking | TRLGDCU 85, TRLGDCU 82, CC 1154 | Consumo's clause 3. LEGAL_RULES FL-20: penalty / daily rent >= 3 gives CHECK; ILLEGAL only with a company landlord. Here the landlord is a private person, so consumer law may not apply and a judge would moderate the penalty under the Civil Code: CHECK. |
| NOVENA | FL-22 | Worth checking | LEC 394, TRLGDCU 82 | Consumo's clause 6. LEC art. 394.1: costs follow the outcome and the court decides. LEGAL_RULES FL-22: CHECK (ILLEGAL only with a company landlord); private landlord here. |
| DÉCIMA | FL-11 | Fine | - | Mirrors art. 21.1 and 21.4 LAU. |
| UNDÉCIMA | OK-COMMUNITY-RULES | Fine | - | LEGAL_RULES §4: community rules are a free agreement (art. 4.2). |
| DUODÉCIMA | FL-21 | Worth checking | TRLGDCU 82, TRLGDCU 88 | Consumo's clause 4. LEGAL_RULES FL-21: TRLGDCU 82.2 (whoever claims individual negotiation must prove it) and 88.2: CHECK. |

### H4 Dudoso 2025 (`ho-2025-borderline`)

Signed 2 de junio de 2025 → regime B (law in force from 2023-05-26). Landlord: a private person. 13 rows: 4 not enforceable, 2 worth checking, 7 fine.

Money at signing: At signing: first month 1,300 + deposit 1,300 = 2,600, under the legal maximum (1,300 + 1,300 + 2 x 1,300 = 5,200). The parents' personal guarantee is not money paid at signing and has no amount.

| Clause | Rule | Verdict | Accepted articles | Why |
| --- | --- | --- | --- | --- |
| SEGUNDA | FL-05 | Fine | - | Keeps the legal extensions of art. 9 LAU. |
| TERCERA | FL-06 | Not enforceable | LAU 9, LAU 14, LAU 6 | LEGAL_RULES FL-06: in the first five years the landlord can only recover the flat in the art. 9.3 case (own or close family's need). Needing it empty to sell is not that case (and art. 14 keeps the lease alive after a sale). |
| CUARTA | FL-15 | Fine | - | Electronic payment. |
| CUARTA | FL-04 | Fine | - | First month at signing. |
| QUINTA | FL-08 | Not enforceable | LAU 18, LAU 6 | Contract signed after 26 May 2023: art. 18.1 and DA 11ª cap each yearly update at the reference index (IRAV, 2.54% in Sept 2026). LEGAL_RULES FL-08: a fixed percentage above the IRAV in force is ILLEGAL for the excess; this one expressly ignores any index. |
| SEXTA | FL-01 | Fine | - | One month's deposit (art. 36.1). |
| SEXTA | FL-02 | Worth checking | LAU 36 | LEGAL_RULES FL-02 trap: a third party's guarantee (parents) with no maximum amount gives CHECK, not ILLEGAL (art. 36.5 caps extra guarantees at two months). |
| SÉPTIMA | FL-09 | Fine | - | Yearly amount written (art. 20.1). |
| SÉPTIMA | FL-10 | Not enforceable | LAU 20, LAU 6 | Regime B: art. 20.1 (2023 text) allows passing taxes on only in writing with the yearly amount; none is stated. LEGAL_RULES FL-10: A/B without the amount gives ILLEGAL. |
| SÉPTIMA | FL-10 | Worth checking | LAU 20 | LEGAL_RULES FL-10 trap and §6.5: in Madrid the occupant may be the person who owes the waste charge (not confirmed), so CHECK, not ILLEGAL. |
| OCTAVA | FL-11 | Fine | - | Mirrors art. 21.1 and 21.4 LAU. |
| NOVENA | FL-07 | Not enforceable | LAU 11, LAU 6 | Art. 11 LAU (A/B): 30 days' notice and at most one month's rent per year left. This asks for 60 days and two months per year (LEGAL_RULES FL-07: more than 30 days' notice or more than the cap is ILLEGAL). |
| DÉCIMA | OK-SUBLET | Fine | - | LEGAL_RULES §4: art. 8 LAU. |

### H5 Temporal con causa oct 2026 (`ho-2026-temporal`)

Signed 20 de octubre de 2026 → regime C (law in force from 2026-10-08). Landlord: a company. 12 rows: 2 not enforceable, 1 worth checking, 9 fine.

Money at signing: At signing: first month 950 + deposit 950 + extra guarantee 950 + check-in fee 250 = 3,100. Legal maximum for a valid temporary contract since 8 Oct 2026: 950 + 950 + 1 x 950 = 2,850. Over: 250. The optional cleaning service is monthly, not paid at signing.

| Clause | Rule | Verdict | Accepted articles | Why |
| --- | --- | --- | --- | --- |
| TÍTULO+PRIMERA+SEGUNDA | FL-19 | Fine | - | Regime C (signed 20 Oct 2026): art. 7.2 LAU requires an express, real and provable cause; it is stated (a master's at UCM, 2026-27, admission letter attached) and the term is 10 months (art. 9 bis: up to 12). LEGAL_RULES FL-19 'Para estudiantes': OK in C. |
| TERCERA | FL-15 | Fine | - | Electronic payment. |
| TERCERA | FL-04 | Fine | - | First month at signing. |
| CUARTA | FL-01 | Fine | - | One month's deposit. |
| CUARTA | FL-02 | Fine | - | Art. 36.5 LAU (C text): for temporary contracts the extra guarantee can't exceed one month. One month is at the cap. |
| QUINTA | FL-03 | Not enforceable (€250 over) | LAU 20, LAU 6 | Regime C: art. 20.2 LAU bans passing on any cost of preparing or formalising the contract 'bajo ningún concepto o denominación'. LEGAL_RULES FL-03 trap: a mandatory inventory or check-in charged to the tenant is a formalisation cost, ILLEGAL in C. |
| SEXTA | FL-03 | Worth checking | LAU 20 | Art. 20.2 LAU (C): a non-essential service can be charged only if the tenant asked for it in writing after being told it is optional and its cost. LEGAL_RULES FL-03 trap: 'si la cláusula dice opcional → CHECK' (the contract's own statement can't prove it was really optional). |
| SÉPTIMA | OK-UTILITIES | Fine | - | LEGAL_RULES §4: metered utilities (art. 20.4 in the C text). |
| SÉPTIMA | FL-10 | Not enforceable | LAU 20, LAU 6 | Regime C: art. 20.1 LAU: 'En ningún caso podrán imponerse los tributos asociados a la vivienda a la parte arrendataria'. Stating the yearly amount no longer saves it (LEGAL_RULES FL-10, C gives ILLEGAL). |
| OCTAVA | FL-07 | Fine | - | Art. 11.2 and 11.3 LAU (C): in a temporary contract the tenant may leave after one month with ten days' notice, with no compensation. The clause says exactly that. |
| NOVENA | FL-16 | Fine | - | Art. 36.4 LAU: within a month, minus real damage or debts. |
| DÉCIMA | OK-SUBLET | Fine | - | LEGAL_RULES §4: art. 8 LAU. |

### H6 Empresa oct 2026 (`ho-2026-company`)

Signed 15 de octubre de 2026 → regime C (law in force from 2026-10-08). Landlord: a company. 12 rows: 4 not enforceable, 1 worth checking, 7 fine.

Money at signing: At signing: first month 1,600 + deposit 1,600 + extra guarantee 3,200 = 6,400, exactly the legal maximum (1,600 + 1,600 + 2 x 1,600). The 200 € renewal fee is charged at each renewal, not at signing.

| Clause | Rule | Verdict | Accepted articles | Why |
| --- | --- | --- | --- | --- |
| SEGUNDA | FL-05 | Not enforceable | LAU 9, LAU 6 | Art. 9.1 LAU: a home contract shorter than seven years with a company landlord is extended year by year up to seven at the tenant's choice; art. 6 voids a clause that removes it (LEGAL_RULES FL-05, A B C). |
| TERCERA | FL-06 | Not enforceable | LAU 9, LAU 6 | Art. 9.3 LAU applies only 'siempre que el arrendador sea persona física'. The landlord is an S.A., so this early recovery has no legal basis in the first seven years (LEGAL_RULES FL-06). |
| CUARTA | FL-15 | Fine | - | Electronic payment (direct debit). |
| CUARTA | FL-04 | Fine | - | First month at signing. |
| QUINTA | FL-08 | Fine | - | Art. 18.1 LAU (C text) names the IRAV as the cap; yearly by the IRAV is fine. |
| SEXTA | FL-01 | Fine | - | One month's deposit. |
| SEXTA | FL-02 | Fine | - | Art. 36.5 LAU: up to two months for home contracts of up to seven years with a company landlord; two months is at the cap. |
| SÉPTIMA | FL-03 | Not enforceable | LAU 20, LAU 6 | Regime C: art. 20.2 LAU defines the banned costs as any service for the 'preparación, formalización, gestión, novación o renovación del contrato'. A renewal-management fee is exactly that. |
| OCTAVA | FL-07 | Not enforceable | LAU 11, LAU 6 | Art. 11 LAU lets the tenant leave once six months have passed, with 30 days' notice; art. 6 voids terms that worsen Title II for the tenant. LEGAL_RULES FL-07 trigger list includes 'prohibición de irse después de los 6 meses'. Forbidding it for twelve months is not enforceable. |
| NOVENA | FL-16 | Worth checking | LAU 36 | Art. 36.4 LAU: after one month from the keys the deposit earns legal interest. LEGAL_RULES FL-16: a return period longer than one month gives CHECK. |
| DÉCIMA | OK-WORKS | Fine | - | LEGAL_RULES §4: art. 23.1 LAU. |
| UNDÉCIMA | FL-18 | Fine | - | Keeps the preferential purchase right of art. 25 (no waiver), which is what the C text of art. 25.8 requires. |

