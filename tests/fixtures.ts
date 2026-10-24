import type { Extraction, SampleFile } from "@/lib/extraction";
import trapsSample from "@/samples/traps-2025.json";
import fairSample from "@/samples/fair-2024.json";
import reformSample from "@/samples/reform-oct-2026.json";
import trapsFx from "@/scripts/fixtures/traps-2025.extraction.json";
import fairFx from "@/scripts/fixtures/fair-2024.extraction.json";
import reformFx from "@/scripts/fixtures/reform-oct-2026.extraction.json";

/** Contract text from the sample + the hand-made extraction from GOLD.md: the engine's exact expectations. */
const withFixture = (s: unknown, fx: unknown): SampleFile => ({ ...(s as SampleFile), extraction: fx as Extraction, provenance: { kind: "hand-made" } });

export const traps = withFixture(trapsSample, trapsFx);
export const fair = withFixture(fairSample, fairFx);
export const reform = withFixture(reformSample, reformFx);
/** The samples as shipped (recorded extraction from Claude, once recorded). */
export const shipped = { traps: trapsSample as SampleFile, fair: fairSample as SampleFile, reform: reformSample as SampleFile };
