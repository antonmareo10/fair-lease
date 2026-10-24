"use client";

import { useMemo, useState } from "react";
import type { SampleFile } from "@/lib/extraction";
import { analyze } from "@/lib/analyze";
import { provenanceLabel } from "@/lib/samples";
import { Header } from "./Brand";
import { StartScreen } from "./StartScreen";
import { ResultView } from "./result/ResultView";

type View = { kind: "start" } | { kind: "result"; text: string; sample: SampleFile };

/** The whole app is one page with a small state machine: start → (checking) → result. */
export function FairLease() {
  const [view, setView] = useState<View>({ kind: "start" });

  const result = useMemo(() => (view.kind === "result" ? analyze(view.text, view.sample.extraction) : null), [view]);

  const home = () => {
    setView({ kind: "start" });
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Header onHome={home} />
      {view.kind === "start" || !result ? (
        <StartScreen onSample={(sample) => setView({ kind: "result", text: sample.text, sample })} />
      ) : (
        <ResultView key={view.sample.id} text={view.text} result={result} label={provenanceLabel(view.sample)} onBack={home} />
      )}
    </>
  );
}
