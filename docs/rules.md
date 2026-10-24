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

## The 18 rules in this build

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
| FL-13 | Landlord can enter whenever they like | [Constitution 18.2](https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229#a18) | Not enforceable |
| FL-14 | Registering at the address (empadronamiento) forbidden | [LBRL 15](https://www.boe.es/buscar/act.php?id=BOE-A-1985-5392#a15) | Not enforceable |
| FL-15 | Rent payable only in cash | [LAU 17.3](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a17) | Worth checking |
| FL-16 | Deposit returned late, without interest, or kept as a penalty | [LAU 36.4](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a36) | Worth checking |
| FL-17 | Mandatory rent-default insurance | [LAU 36.5](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a36) | Not enforceable since Oct 2026; before, Your right |
| FL-18 | Waiver of the right to buy first (tanteo y retracto) | [LAU 25.8](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a25) | Not enforceable since Oct 2026; fine before |
| FL-19 | "Seasonal" contract without a real, stated reason | [LAU 7.2](https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a7) | Not enforceable since Oct 2026; worth checking before |

Every rule also recognises the legal version of its clause and shows it as **Fine**, so a fair contract comes out clean.

**Legal even if it feels harsh** (shown as Fine): no pets (LAU 4.2), no subletting or works without written consent (LAU 8, 23.1), utilities with individual meters (LAU 20.3), no leaving in the first six months (LAU 11).

**Not in this build:** FL-12 (sale ends the contract), FL-20 (late-handover penalty), FL-21 ("all clauses were negotiated" boilerplate) and FL-22 (all legal costs on the tenant). A missing rental-registry number is never flagged: the Supreme Court annulled that registry in 2026.

## Tested against expected results

Three fictional contracts were written before the project, together with the result each clause should get. The tests in [`tests/`](../tests) run the rules against them:

- **A contract full of traps (2025):** 10 not enforceable, 2 worth checking, 6 fine. It commits €11,741.50 at signing against a legal maximum of €4,600.
- **A fair contract (2024):** nothing not enforceable and nothing worth checking.
- **Signed after the Oct 2026 reform:** FL-19, 17, 10, 07 and 18 not enforceable. The same waiver of the right to buy is fine in the 2025 contract and not enforceable here.
