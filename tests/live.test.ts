import { describe, expect, it } from "vitest";
import { anonymize } from "@/lib/anonymize";
import { checkInput } from "@/lib/validate";
import { createLimiter } from "@/lib/limit";
import { runExtraction, type ModelCall } from "@/lib/extract";
import type { SampleFile } from "@/lib/extraction";
import { traps, reform } from "./fixtures";

describe("Anonymizer", () => {
  it("removes the demo DNIs and NIE, plus IBANs, phones and emails", () => {
    const r = anonymize(
      "DNI 00000000T, NIE X0000000T, IBAN ES91 2100 0418 4502 0005 1332, tel. +34 612 34 56 78 o 915551234, correo ana.p@example.es. CP 28015, renta 1.150 €.",
    );
    expect(r.text).toBe("DNI [DNI], NIE [NIE], IBAN [IBAN], tel. [PHONE] o [PHONE], correo [EMAIL]. CP 28015, renta 1.150 €.");
    expect(r.removed).toEqual({ dni: 1, nie: 1, iban: 1, phone: 2, email: 1 });
  });
  it("leaves quotes of the samples intact", () => {
    for (const s of [traps, reform] as SampleFile[]) {
      const { text } = anonymize(s.text);
      for (const c of s.extraction.clauses) expect(text).toContain(c.quote);
    }
  });
});

describe("Input Validator", () => {
  it("rejects empty, too short and too long", () => {
    expect(checkInput("   ")).toMatchObject({ ok: false, reason: "empty" });
    expect(checkInput("Contrato de alquiler.")).toMatchObject({ ok: false, reason: "short" });
    expect(checkInput("a".repeat(60_001))).toMatchObject({ ok: false, reason: "long" });
    expect(checkInput((traps as SampleFile).text)).toEqual({ ok: true });
  });
});

describe("Daily Live Limit", () => {
  it("stops at the daily cap and throttles one IP per hour", () => {
    let t = Date.parse("2026-10-24T10:00:00Z");
    const l = createLimiter({ daily: 3, perIpPerHour: 2, now: () => t });
    expect(l.take("a")).toBe(true);
    expect(l.take("a")).toBe(true);
    expect(l.take("a")).toBe(false); // per-IP
    expect(l.take("b")).toBe(true);
    expect(l.take("c")).toBe(false); // daily cap
    t += 24 * 3_600_000;
    expect(l.take("c")).toBe(true); // new day
  });
});

describe("Live Analysis Route core", () => {
  const sample = traps as SampleFile;
  const body = { text: sample.text };
  const deps = (call: ModelCall, extra = {}) => ({ call, model: "claude-haiku-5-5", limiter: createLimiter({ daily: 25 }), ip: "1.1.1.1", hasKey: true, ...extra });
  const ok: ModelCall = async () => ({ stopReason: "end_turn", output: sample.extraction, model: "claude-haiku-5-5" });

  it("returns a validated extraction", async () => {
    const r = await runExtraction(body, deps(ok));
    expect(r.ok && r.extraction.clauses.length).toBe(18);
  });
  it("maps a refusal to unavailable", async () => {
    const r = await runExtraction(body, deps(async () => ({ stopReason: "refusal", output: null, model: "x" })));
    expect(r).toEqual({ ok: false, error: "unavailable" });
  });
  it("retries one malformed reply, then gives up", async () => {
    let calls = 0;
    const bad: ModelCall = async () => (calls++, { stopReason: "end_turn", output: { facts: {} }, model: "x" });
    expect(await runExtraction(body, deps(bad))).toEqual({ ok: false, error: "unavailable" });
    expect(calls).toBe(2);
    let n = 0;
    const flaky: ModelCall = async () => (n++ === 0 ? { stopReason: "end_turn", output: "nope", model: "x" } : ok("", ""));
    expect((await runExtraction(body, deps(flaky))).ok).toBe(true);
  });
  it("says when it isn't a Spanish rental contract", async () => {
    const notContract: ModelCall = async () => ({
      stopReason: "end_turn",
      output: { ...sample.extraction, facts: { ...sample.extraction.facts, is_rental_contract: false } },
      model: "x",
    });
    expect(await runExtraction(body, deps(notContract))).toEqual({ ok: false, error: "not_a_contract" });
  });
  it("enforces the limit, the input bounds and the key", async () => {
    const limiter = createLimiter({ daily: 0 });
    expect(await runExtraction(body, deps(ok, { limiter }))).toEqual({ ok: false, error: "limit" });
    expect(await runExtraction({ text: "short" }, deps(ok))).toEqual({ ok: false, error: "bad_input" });
    expect(await runExtraction({}, deps(ok))).toEqual({ ok: false, error: "bad_input" });
    expect(await runExtraction(body, deps(ok, { hasKey: false }))).toEqual({ ok: false, error: "unavailable" });
  });
  it("treats a thrown API error as unavailable", async () => {
    const boom: ModelCall = async () => {
      throw new Error("network");
    };
    expect(await runExtraction(body, deps(boom))).toEqual({ ok: false, error: "unavailable" });
  });
});
