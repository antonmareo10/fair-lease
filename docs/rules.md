# Fair Lease rules

Fair Lease's verdicts come from the rules below, written in TypeScript under [`lib/rules/`](../lib/rules). Claude never decides legality: it only extracts facts and quotes from the contract, and the code checks that every quote is literally in the text.

The rules were checked by hand against the consolidated texts in the BOE (Spain's official gazette) on 21 Oct 2026. The legal quotes in the app are copied from those texts; the English versions are unofficial translations. **This is an information tool, not legal advice.**

## Which law applies

A contract is governed by the text of the LAU (Ley de Arrendamientos Urbanos) in force on the day it was signed.

| Signed | Text that applies | In the app |
|---|---|---|
| Before 6 Mar 2019 | Older versions | Not checked; the app says so |
| 6 Mar 2019 – 25 May 2023 | LAU after RDL 7/2019 | "2019 rules" |
| 26 May 2023 – 7 Oct 2026 | LAU after Ley 12/2023 | "May 2023 rules" |
| 1–2 Oct 2026 | RDL 26/2026, later repealed by Congress | Treated as May 2023 rules, with a warning |
| From 8 Oct 2026 | LAU after RDL 29/2026 | "Oct 2026 reform", tagged *pending Congress vote* |

RDL 29/2026 still needs approval by Congress (through the Diputación Permanente; a session was expected on 12 Nov 2026). If it isn't approved, contracts signed since 8 Oct 2026 fall back to the May 2023 rules. Madrid has no declared stressed-market zones, so the app applies no rent caps.

With no signing date in the contract, the app uses today's law and lets the tenant pick a date.

## The 22 rules in this build

| ID | What it detects | Legal basis | Verdict |
|---|---|---|---|
| FL-01 | Deposit (fianza) above one month | [LAU 36.1](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a36) | Worth checking |
| FL-02 | Extra guarantees above two months (one for valid temporary contracts since Oct 2026) | [LAU 36.5](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a36) | Not enforceable |
| FL-03 | Agency or contract-preparation fees charged to the tenant | [LAU 20.1 / 20.2](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a20) | Not enforceable (2019 text: only with a company landlord) |
| FL-04 | More than one month's rent in advance | [LAU 17.2](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a17) | Not enforceable |
| FL-05 | Waiver of the yearly extensions up to 5 (or 7) years | [LAU 9.1 and 6](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a9) | Not enforceable |
| FL-06 | Landlord can end the contract early beyond the art. 9.3 case | [LAU 9.3](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a9) | Not enforceable |
| FL-07 | Early-exit penalty above one month per year left; any penalty since Oct 2026 | [LAU 11](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a11) | Not enforceable |
| FL-08 | Rent update more than yearly or above the official index (IRAV 2.54 %, Sept 2026) | [LAU 18.1](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a18) | Not enforceable |
| FL-08 | 2 % cap on updates between 8 Oct 2026 and 31 Dec 2027 | [RDL 29/2026, DF 6ª](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-20823) | Your right (pending vote) |
| FL-09 | Community fees with no yearly amount written | [LAU 20.1](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a20) | Not enforceable |
| FL-10 | Property tax (IBI) passed on to the tenant | [LAU 20.1](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a20) | Not enforceable since Oct 2026; before, only without a yearly amount |
| FL-11 | All repairs charged to the tenant | [LAU 21](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a21) | Not enforceable |
| FL-12 | "If the flat is sold, the contract ends" | [LAU 14](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a14) | Not enforceable (the buyer takes over the lease for the first 5, or 7, years) |
| FL-13 | Landlord can enter whenever they like | [Constitution 18.2](https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229#a18) | Not enforceable |
| FL-14 | Registering at the address (empadronamiento) forbidden | [LBRL 15](https://www.boe.es/buscar/act.php?id=BOE-A-1985-5392#a15) | Not enforceable |
| FL-15 | Rent payable only in cash | [LAU 17.3](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a17) | Worth checking |
| FL-16 | Deposit returned late, without interest, or kept as a penalty | [LAU 36.4](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a36) | Worth checking |
| FL-17 | Mandatory rent-default insurance | [LAU 36.5](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a36) | Not enforceable since Oct 2026; before, Your right |
| FL-18 | Waiver of the right to buy first (tanteo y retracto) | [LAU 25.8](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a25) | Not enforceable since Oct 2026; fine before |
| FL-19 | "Seasonal" contract without a real, stated reason | [LAU 7.2](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a7) | Not enforceable since Oct 2026; worth checking before |
| FL-20 | Penalty of three times the daily rent or more for each day of a late handover | [TRLGDCU 85.6](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555#a85) | Not enforceable with a company landlord; worth checking with a private one |
| FL-21 | "Both parties declare every clause was negotiated individually" | [TRLGDCU 82.2](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555#a82) | Worth checking |
| FL-22 | All court and lawyer costs on the tenant, whatever the outcome | [LEC 394.1](https://www.boe.es/buscar/act.php?id=BOE-A-2000-323#a394) | Not enforceable with a company landlord; worth checking with a private one |

Every rule also recognises the legal version of its clause and shows it as **Fine**, so a fair contract comes out clean.

**Legal even if it feels harsh** (shown as Fine): no pets (LAU 4.2), no subletting or works without written consent (LAU 8, 23.1), utilities with individual meters (LAU 20.3), no leaving in the first six months (LAU 11).

FL-03 also catches a renewal, inventory or check-in fee whatever the clause is called, and since Oct 2026 an "optional" service charged to the tenant is worth checking (art. 20.2 allows it only if the tenant asked for it in writing). FL-07 also flags a lock-in longer than the law allows: six months, or one month in a valid temporary contract since Oct 2026. FL-06 reads the whole clause paragraph from the contract, not only the quote, before it accepts an art. 9.3 "need" clause.

Together with FL-01, FL-02, FL-03, FL-07 and FL-16, the new FL-20, FL-21 and FL-22 cover the six abusive clauses Spain's consumer ministry said it found most often in rental contracts ([Consumo, 22 May 2026](https://www.dsca.gob.es/es/comunicacion/notas-prensa/consumo-informa-principales-clausulas-abusivas-detectadas-contratos)): management fees, deposits and guarantees above the limit, a disproportionate late-handover penalty, the "negotiated individually" declaration, keeping the deposit unless the whole term is served, and all court costs on the tenant.

FL-12, FL-20, FL-21 and FL-22 were left out of the first build and added on 25 Oct 2026, after the held-out evaluation in [`eval/`](../eval/README.md) showed the clauses they cover. A missing rental-registry number is never flagged: the Supreme Court annulled that registry in 2026.

## Tested against expected results

Three fictional contracts were written before the project, together with the result each clause should get. The tests in [`tests/`](../tests) run the rules against them:

- **A contract full of traps (2025):** 10 not enforceable, 2 worth checking, 6 fine. It commits €11,741.50 at signing against a legal maximum of €4,600.
- **A fair contract (2024):** nothing not enforceable and nothing worth checking.
- **Signed after the Oct 2026 reform:** FL-19, 17, 10, 07 and 18 not enforceable. The same waiver of the right to buy is fine in the 2025 contract and not enforceable here.
