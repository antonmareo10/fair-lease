/**
 * The "model alone" configuration: the question a person would type into any assistant, plus the
 * smallest amount of structure needed to score the answer automatically. No rules, no reference
 * texts, no quote checking and no hint about which clauses are the problem.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { ModelAloneOutput } from "./score";

export const modelAloneSchema = z.object({
  law_version_name: z.string().describe("Name of the version of the LAU you applied."),
  law_version_in_force_from: z.string().describe("Date yyyy-mm-dd from which that version of the LAU is in force."),
  clauses: z.array(
    z.object({
      clause_ref: z.string().describe("Clause heading as written, e.g. 'QUINTA'."),
      quote: z.string().describe("The sentence of the contract this point is about, copied literally."),
      verdict: z.enum(["not_enforceable", "review", "correct"]),
      articles: z.array(z.object({ law: z.string(), article: z.string() })),
      euros_over_limit: z.number().nullable(),
      reason: z.string(),
    }),
  ),
  total_euros_over_limit_at_signing: z.number().nullable(),
});

export function modelAlonePrompt(contract: string, signedLong: string): string {
  return `Revisa este contrato de alquiler español firmado el ${signedLong} y dime qué cláusulas no son exigibles según la LAU, con el artículo.

Recorre el contrato entero y haz una entrada por cada punto relevante de cada cláusula (también los que estén bien), con:
- clause_ref: el encabezado de la cláusula tal como está escrito (por ejemplo QUINTA).
- quote: la frase del contrato a la que se refiere, copiada literalmente.
- verdict: not_enforceable si la cláusula (o esa parte) no es exigible según la LAU, review si es dudosa o conviene revisarla, correct si está bien.
- articles: los artículos en los que te basas (ley y número, por ejemplo LAU 36.5). Vacío si no hay.
- euros_over_limit: si el contrato exige pagar más de lo que permite la ley, los euros de más; si no, null.
- reason: una frase.

Indica también qué versión de la LAU aplicas (la que estaba en vigor el día de la firma) y desde qué fecha rige, y el total de euros de más que el contrato exige a la firma respecto al máximo legal (null si ninguno).

<contract>
${contract}
</contract>`;
}

let client: Anthropic | null = null;

/** Same request shape as lib/claude.ts (structured output, effort, refusal fallbacks), only the prompt differs. */
export async function callModelAlone(contract: string, signedLong: string, model: string, effort: "low" | "medium" | "high") {
  client ??= new Anthropic();
  const withFallbacks = model === "claude-sonnet-5-5" || model === "claude-opus-5-5";
  const message = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    messages: [{ role: "user", content: modelAlonePrompt(contract, signedLong) }],
    output_config: { effort, format: betaZodOutputFormat(modelAloneSchema) },
    ...(withFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });
  return {
    stopReason: message.stop_reason,
    output: message.parsed_output as ModelAloneOutput | null,
    model: message.model,
    usage: { input_tokens: message.usage.input_tokens, output_tokens: message.usage.output_tokens },
  };
}
