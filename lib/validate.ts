/** Input Validator (spec.md > Input Validator, prd.md > Contract Input). */
export const MIN_CHARS = 300;
export const MAX_CHARS = 60_000;

export type InputCheck = { ok: true } | { ok: false; reason: "empty" | "short" | "long"; message: string };

export function checkInput(text: string): InputCheck {
  const t = text.trim();
  if (t.length === 0) return { ok: false, reason: "empty", message: "Paste your contract to check it." };
  if (t.length < MIN_CHARS)
    return {
      ok: false,
      reason: "short",
      message: `That's too short to be a rental contract (${t.length} characters). Paste the whole contract, or try a sample.`,
    };
  if (t.length > MAX_CHARS)
    return {
      ok: false,
      reason: "long",
      message: `That's longer than a rental contract usually is (${t.length.toLocaleString("en-GB")} characters, the limit is ${MAX_CHARS.toLocaleString("en-GB")}). Paste only the contract itself.`,
    };
  return { ok: true };
}
