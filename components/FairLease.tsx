"use client";

import { useMemo, useState } from "react";
import type { Extraction, SampleFile } from "@/lib/extraction";
import { analyze } from "@/lib/analyze";
import { anonymize, describeRemoved } from "@/lib/anonymize";
import { checkInput } from "@/lib/validate";
import { provenanceLabel } from "@/lib/samples";
import { RULE_COUNT } from "@/lib/rules";
import type { ExtractResponse } from "@/lib/extract";
import { Header } from "./Brand";
import { StartScreen } from "./StartScreen";
import { CheckingSteps, type Step } from "./CheckingSteps";
import { ResultView } from "./result/ResultView";

type Shown = { id: string; text: string; extraction: Extraction; label: string; removed: string };
type View = { kind: "start" } | { kind: "checking"; steps: Step[] } | { kind: "result"; shown: Shown };

const ERRORS: Record<string, string> = {
  limit: "Live checks are paused for today. The samples still work, and you can try again tomorrow.",
  unavailable: "Live checks are paused right now. The samples still work.",
  not_a_contract: "This doesn't look like a Spanish rental contract. Paste the Spanish original, or try a sample.",
  bad_input: "That text can't be checked. Paste the whole contract, or try a sample.",
};

const MODEL_NAMES: Record<string, string> = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
};

const STEP_LABELS = [
  "Removing personal data",
  "Reading clauses",
  "Checking the date and the law version",
  `Applying ${RULE_COUNT} rules`,
  "Verifying every quote is in your contract",
];

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The whole app is one page with a small state machine: start → checking → result. */
export function FairLease() {
  const [view, setView] = useState<View>({ kind: "start" });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dateOverride, setDateOverride] = useState<string | null>(null);

  const result = useMemo(
    () => (view.kind === "result" ? analyze(view.shown.text, view.shown.extraction, { dateOverride }) : null),
    [view, dateOverride],
  );

  const home = () => {
    setView({ kind: "start" });
    setDateOverride(null);
    window.scrollTo({ top: 0 });
  };

  const showResult = (shown: Shown) => {
    setDateOverride(null);
    setView({ kind: "result", shown });
    window.scrollTo({ top: 0 });
  };

  const openSample = (sample: SampleFile) => {
    setError(null);
    const anon = anonymize(sample.text);
    showResult({ id: sample.id, text: anon.text, extraction: sample.extraction, label: provenanceLabel(sample), removed: describeRemoved(anon.removed) });
  };

  const checkLive = async (raw: string) => {
    const valid = checkInput(raw);
    if (!valid.ok) {
      setError(valid.message);
      return;
    }
    setError(null);
    const anon = anonymize(raw.trim());
    const removed = describeRemoved(anon.removed);
    const steps = (doneUpTo: number, extra: Partial<Record<number, string>> = {}): Step[] =>
      STEP_LABELS.map((label, i) => ({
        label,
        detail: i === 0 ? `${anon.total} removed: ${removed}` : extra[i],
        state: i < doneUpTo ? "done" : i === doneUpTo ? "active" : "todo",
      }));
    setView({ kind: "checking", steps: steps(1) });
    window.scrollTo({ top: 0 });

    let data: ExtractResponse | null = null;
    try {
      const res = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: anon.text }) });
      data = (await res.json()) as ExtractResponse;
    } catch {
      data = null;
    }
    if (!data || !data.ok) {
      setError(ERRORS[data && !data.ok ? data.error : "unavailable"]);
      setView({ kind: "start" });
      return;
    }
    const extraction = data.extraction;
    const model = MODEL_NAMES[data.model] ?? data.model;
    const quotes = extraction.clauses.length;
    // The remaining phases run in the browser; tick each one as it completes.
    setView({ kind: "checking", steps: steps(2, { 1: `${quotes} clauses quoted by ${model}` }) });
    await pause(160);
    setView({ kind: "checking", steps: steps(3, { 1: `${quotes} clauses quoted by ${model}` }) });
    await pause(160);
    setView({ kind: "checking", steps: steps(4, { 1: `${quotes} clauses quoted by ${model}` }) });
    await pause(160);
    showResult({ id: `live-${Date.now()}`, text: anon.text, extraction, label: `Live check · read by ${model}`, removed });
  };

  return (
    <>
      <Header onHome={home} />
      {view.kind === "checking" ? (
        <CheckingSteps steps={view.steps} />
      ) : view.kind === "result" && result ? (
        <ResultView
          key={`${view.shown.id}:${dateOverride ?? ""}`}
          text={view.shown.text}
          result={result}
          label={view.shown.label}
          removed={view.shown.removed}
          onBack={home}
          onDate={setDateOverride}
        />
      ) : (
        <StartScreen draft={draft} onDraft={setDraft} error={error} onCheck={checkLive} onSample={openSample} />
      )}
    </>
  );
}
