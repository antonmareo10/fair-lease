import { extractionSchema, type Extraction } from "@/lib/extraction";
import { checkInput } from "@/lib/validate";
import type { Limiter } from "@/lib/limit";

export type ModelReply = {
  stopReason: string | null;
  /** The parsed structured output (unvalidated). */
  output: unknown;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
};

export type ModelCall = (contract: string, model: string) => Promise<ModelReply>;

export type ExtractError = "limit" | "unavailable" | "not_a_contract" | "bad_input";

export type ExtractResponse =
  | { ok: true; extraction: Extraction; model: string; usage?: ModelReply["usage"] }
  | { ok: false; error: ExtractError };

type Deps = { call: ModelCall; model: string; limiter: Limiter; ip: string; hasKey: boolean };

/**
 * The server side of a live check (spec.md > Live Analysis Route): validate, rate-limit,
 * ask Claude for facts and quotes only, and validate the reply against the schema.
 */
export async function runExtraction(body: unknown, deps: Deps): Promise<ExtractResponse> {
  const text = typeof body === "object" && body !== null && "text" in body ? (body as { text: unknown }).text : undefined;
  if (typeof text !== "string" || !checkInput(text).ok) return { ok: false, error: "bad_input" };
  if (!deps.hasKey) return { ok: false, error: "unavailable" };
  if (!deps.limiter.take(deps.ip)) return { ok: false, error: "limit" };

  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: ModelReply;
    try {
      reply = await deps.call(text, deps.model);
    } catch (e) {
      console.error("extract: model call failed", e instanceof Error ? e.name : "unknown");
      return { ok: false, error: "unavailable" };
    }
    if (reply.stopReason === "refusal" || reply.stopReason === "max_tokens") return { ok: false, error: "unavailable" };
    const parsed = extractionSchema.safeParse(reply.output);
    if (!parsed.success) continue; // one retry on a malformed reply
    const { facts } = parsed.data;
    if (!facts.is_rental_contract || facts.language !== "es") return { ok: false, error: "not_a_contract" };
    return { ok: true, extraction: parsed.data, model: reply.model, usage: reply.usage };
  }
  return { ok: false, error: "unavailable" };
}
