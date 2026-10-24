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
  const [dateOverride, setDateOverride] = useState<string | null>(null);

  const result = useMemo(
    () => (view.kind === "result" ? analyze(view.text, view.sample.extraction, { dateOverride }) : null),
    [view, dateOverride],
  );

  const home = () => {
    setView({ kind: "start" });
    setDateOverride(null);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Header onHome={home} />
      {view.kind === "start" || !result ? (
        <StartScreen
          onSample={(sample) => {
            setDateOverride(null);
            setView({ kind: "result", text: sample.text, sample });
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <ResultView
          key={`${view.sample.id}:${dateOverride ?? ""}`}
          text={view.text}
          result={result}
          label={provenanceLabel(view.sample)}
          onBack={home}
          onDate={setDateOverride}
        />
      )}
    </>
  );
}
