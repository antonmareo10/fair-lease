import type { Clause } from "@/lib/extraction";
import type { Span } from "@/lib/quotes";
import type { Finding, Verdict } from "@/lib/rules/types";
import { SEVERITY } from "@/lib/rules/types";

export type NoteGroup = {
  key: string;
  /** e.g. "QUINTA"; null for notes about the whole contract. */
  clauseRef: string | null;
  clauseIndices: number[];
  findings: Finding[];
  top: Verdict;
  /** Where the group's first highlight starts in the text (for ordering). */
  at: number;
};

/** Group findings by contract clause, most severe first inside each group (prd.md > Findings and Verdicts). */
export function buildGroups(findings: Finding[], clauses: Clause[], spans: (Span | null)[]): NoteGroup[] {
  const groups = new Map<string, NoteGroup>();
  for (const f of findings) {
    const first = f.clauseIndices.find((i) => spans[i]);
    const ref = first !== undefined ? clauses[first].clause_ref : null;
    const key = ref ?? "contract";
    const g =
      groups.get(key) ??
      ({ key, clauseRef: ref, clauseIndices: [], findings: [], top: f.verdict, at: first !== undefined ? spans[first]!.start : -1 } satisfies NoteGroup);
    g.findings.push(f);
    for (const i of f.clauseIndices) if (!g.clauseIndices.includes(i)) g.clauseIndices.push(i);
    if (first !== undefined) g.at = g.at < 0 ? spans[first]!.start : Math.min(g.at, spans[first]!.start);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => {
      const sorted = [...g.findings].sort((a, b) => SEVERITY[b.verdict] - SEVERITY[a.verdict]);
      return { ...g, findings: sorted, top: sorted[0].verdict };
    })
    .sort((a, b) => a.at - b.at);
}

export function groupForClause(groups: NoteGroup[], clauseIndex: number): NoteGroup | undefined {
  return groups.find((g) => g.clauseIndices.includes(clauseIndex));
}
