import { callClaude } from "@/lib/claude";
import { runExtraction } from "@/lib/extract";
import { createLimiter } from "@/lib/limit";

/** Live Analysis Route (spec.md > Live Analysis Route). Logs no contract text. */
export const maxDuration = 120;

const limiter = createLimiter({ daily: Number(process.env.FL_DAILY_LIVE_LIMIT ?? 25) || 25 });
const STATUS = { limit: 429, unavailable: 503, not_a_contract: 422, bad_input: 400 } as const;

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad_input" }, { status: 400 });
  }
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const result = await runExtraction(body, {
    call: callClaude,
    model: process.env.FL_LIVE_MODEL || "claude-sonnet-5-5",
    limiter,
    ip,
    hasKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
  return Response.json(result, { status: result.ok ? 200 : STATUS[result.error], headers: { "Cache-Control": "no-store" } });
}
