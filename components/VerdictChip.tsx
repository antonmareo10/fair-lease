import type { Verdict } from "@/lib/rules/types";
import { VERDICT_LABEL } from "@/lib/rules/types";

/** Icon + text, never colour alone (prd.md > Look and Feel). */
export function VerdictIcon({ verdict, size = 14 }: { verdict: Verdict; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 16 16", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (verdict) {
    case "ILLEGAL":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.4" />
          <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" />
        </svg>
      );
    case "CHECK":
      return (
        <svg {...common}>
          <path d="M8 2.2 14.3 13.2H1.7Z" />
          <path d="M8 6.4v3.1M8 11.4v.1" />
        </svg>
      );
    case "OK":
      return (
        <svg {...common}>
          <path d="M3 8.4l3.2 3.1L13 4.7" />
        </svg>
      );
    case "INFO":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.4" />
          <path d="M8 7.3v3.9M8 4.8v.1" />
        </svg>
      );
  }
}

export function VerdictChip({ verdict, label }: { verdict: Verdict; label?: string }) {
  return (
    <span className={`chip v-${verdict}`}>
      <VerdictIcon verdict={verdict} />
      {label ?? VERDICT_LABEL[verdict]}
    </span>
  );
}
