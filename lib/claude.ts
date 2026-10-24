import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { extractionSchema } from "@/lib/extraction";
import { SYSTEM_PROMPT, userMessage } from "@/lib/prompt";
import type { ModelCall } from "@/lib/extract";

/** Models that accept server-side refusal fallbacks in the "default" form. */
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5"]);

let client: Anthropic | null = null;

/**
 * One structured-output request to Claude (spec.md > External Services and Dependencies).
 * Server-only: the key never reaches the browser.
 */
export const callClaude: ModelCall = async (contract, model) => {
  client ??= new Anthropic();
  const withFallbacks = FALLBACK_MODELS.has(model);
  const message = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage(contract) }],
    output_config: { effort: "low", format: betaZodOutputFormat(extractionSchema) },
    ...(withFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });
  return {
    stopReason: message.stop_reason,
    output: message.parsed_output,
    model: message.model,
    usage: { input_tokens: message.usage.input_tokens, output_tokens: message.usage.output_tokens },
  };
};
