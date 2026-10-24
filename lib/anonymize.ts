/**
 * Anonymizer (spec.md > Anonymizer). Runs in the browser before anything is sent.
 * Removes ID numbers, IBANs, phone numbers and emails. Names are not promised:
 * simple rules can't find them reliably.
 */

export type Removed = { dni: number; nie: number; iban: number; phone: number; email: number };

const PATTERNS: { key: keyof Removed; tag: string; re: RegExp }[] = [
  { key: "email", tag: "[EMAIL]", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { key: "iban", tag: "[IBAN]", re: /\bES\d{2}(?:[ -]?\d{4}){5}\b/gi },
  { key: "nie", tag: "[NIE]", re: /\b[XYZ][- ]?\d{7}[- ]?[A-HJ-NP-TV-Z]\b/g },
  { key: "dni", tag: "[DNI]", re: /\b\d{8}[- ]?[A-HJ-NP-TV-Z]\b/g },
  { key: "phone", tag: "[PHONE]", re: /(?:\+34[ .-]?|0034[ .-]?)?\b[6789](?:[ .-]?\d){8}\b/g },
];

export function anonymize(input: string): { text: string; removed: Removed; total: number } {
  const removed: Removed = { dni: 0, nie: 0, iban: 0, phone: 0, email: 0 };
  let text = input;
  for (const { key, tag, re } of PATTERNS) {
    text = text.replace(re, () => {
      removed[key] += 1;
      return tag;
    });
  }
  const total = Object.values(removed).reduce((a, b) => a + b, 0);
  return { text, removed, total };
}

export function describeRemoved(r: Removed): string {
  const parts: string[] = [];
  const add = (n: number, one: string, many: string) => n && parts.push(`${n} ${n === 1 ? one : many}`);
  add(r.dni, "ID number (DNI)", "ID numbers (DNI)");
  add(r.nie, "foreigner ID (NIE)", "foreigner IDs (NIE)");
  add(r.iban, "bank account", "bank accounts");
  add(r.phone, "phone number", "phone numbers");
  add(r.email, "email", "emails");
  return parts.length ? parts.join(", ") : "nothing to remove";
}
