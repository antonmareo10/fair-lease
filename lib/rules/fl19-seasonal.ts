import type { Rule } from "./types";
import { LAW } from "./texts";
import { finding, has, isC, isSeasonal, minYears, ofTopic } from "./helpers";

/** FL-19 · "Seasonal" or "temporary" contract without a real, stated reason. */
export const fl19: Rule = {
  id: "FL-19",
  name: "Seasonal contract without a real reason",
  evaluate(ctx) {
    if (!isSeasonal(ctx)) return [];
    const related = ofTopic(ctx, "temporal_cause");
    const indices = related.map((r) => r.index);
    const cause = ctx.facts.temporal_cause?.trim();
    const renewals = related.some(({ clause }) => has(clause, "successive_renewals"));
    const tooLong = (ctx.facts.duration_months ?? 0) > 12;

    if (isC(ctx)) {
      if (!cause || renewals || tooLong) {
        const reasons = [!cause && "it states no concrete reason for a temporary stay", renewals && "it can be renewed again and again", tooLong && "it runs longer than 12 months"].filter(Boolean);
        return [
          finding("FL-19", "ILLEGAL", indices, {
            title: "Called 'seasonal', but it's really your home",
            body: `Since 8 Oct 2026 a temporary contract must state a real, provable reason (work, studies, medical treatment…). Here ${reasons.join(", and ")}, so the law treats it as a permanent-home contract, with all its protections.`,
            number: `Treated as a home: up to ${minYears(ctx)} years`,
            law: LAW.LAU_7_2_C,
            askInstead: {
              en: "Without a stated reason for a temporary stay, article 7.2 LAU treats this as a permanent-home contract. Can we write it as one?",
              es: "Sin una causa de temporalidad expresa, el artículo 7.2 de la LAU lo somete al régimen de vivienda habitual. ¿Lo formalizamos como tal?",
            },
            newSinceOct2026: true,
          }),
        ];
      }
      return [
        finding("FL-19", "OK", indices, {
          title: "Temporary contract with a stated reason",
          body: `A temporary contract with a real reason ("${cause}") is allowed, for up to 12 months.`,
          law: LAW.LAU_7_2_C,
        }),
      ];
    }

    if (ctx.law.regime === "A" || ctx.law.regime === "B") {
      return [
        finding("FL-19", "CHECK", indices, {
          title: "Seasonal contract: is it really your home?",
          body: "Before 8 Oct 2026 a seasonal contract wasn't covered by the home rules. If this is in fact your permanent home, a judge can treat it as a home contract, so it's worth checking.",
          law: LAW.LAU_3_2,
        }),
      ];
    }
    return [];
  },
};
