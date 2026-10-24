import type { SampleFile } from "@/lib/extraction";
import traps from "@/samples/traps-2025.json";
import fair from "@/samples/fair-2024.json";
import reform from "@/samples/reform-oct-2026.json";

/** The one-click samples (prd.md > Samples). Order matters: it's the order on the start screen. */
export const SAMPLES: { file: SampleFile; blurb: string }[] = [
  { file: traps as SampleFile, blurb: "Madrid flat · €1,150 a month · signed Sep 2025" },
  { file: fair as SampleFile, blurb: "Madrid flat · €980 a month · signed Feb 2024" },
  { file: reform as SampleFile, blurb: "Company landlord · €1,400 a month · signed Oct 2026" },
];

export function provenanceLabel(sample: SampleFile): string {
  const p = sample.provenance;
  if (p.kind === "recorded") {
    const when = p.recordedAt ? new Date(p.recordedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
    return `Sample · recorded extraction${p.model ? ` (${p.model}${when ? `, ${when}` : ""})` : ""}`;
  }
  return "Sample · hand-made extraction";
}
