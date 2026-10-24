"use client";

import { useEffect, useState } from "react";
import { MILESTONES, formatLongDate, isoToday, type LawVersion } from "@/lib/law";

const FROM = Date.parse("2018-07-01");
const TO = Date.parse("2027-12-31");
const pos = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(iso) - FROM) / (TO - FROM)) * 100));

const TRACK_CAPTION = "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-2";

/** The three versions of the LAU as a track, with a marker that slides to the signing date. */
function Track({ law }: { law: LawVersion }) {
  const [x, setX] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setX(pos(law.date)));
    return () => cancelAnimationFrame(id);
  }, [law.date]);

  const ms = MILESTONES.map((m) => ({ ...m, x: pos(m.date) }));
  return (
    <div className="relative h-[68px] select-none" aria-hidden="true">
      {/* Track, one band per version of the law. */}
      <div className="absolute inset-x-0 top-[30px] h-[6px] overflow-hidden rounded-full bg-[var(--rule)]">
        <div className="absolute inset-y-0 bg-[var(--ink-2)]/25" style={{ left: `${ms[0].x}%`, width: `${ms[1].x - ms[0].x}%` }} />
        <div className="absolute inset-y-0 bg-[var(--ink-2)]/45" style={{ left: `${ms[1].x}%`, width: `${ms[2].x - ms[1].x}%` }} />
        <div
          className="absolute inset-y-0"
          style={{
            left: `${ms[2].x}%`,
            right: 0,
            backgroundImage: "repeating-linear-gradient(135deg, var(--ink-2) 0 3px, transparent 3px 7px)",
            opacity: 0.55,
          }}
        />
      </div>
      {ms.map((m) => (
        <div key={m.date} className="absolute top-[24px] -translate-x-1/2" style={{ left: `${m.x}%` }}>
          <div className="mx-auto h-[18px] w-[2px] bg-[var(--ink)]" />
          <p className="mt-1 whitespace-nowrap text-center text-[0.72rem] font-semibold">{m.label}</p>
        </div>
      ))}
      <div
        className={`absolute top-0 -translate-x-1/2 transition-[left] duration-[900ms] ease-[var(--ease)] v-${law.regime === "C" ? "CHECK" : "INFO"}`}
        style={{ left: `${x}%` }}
      >
        <p className="mb-1 whitespace-nowrap rounded-full bg-[var(--ink)] px-2 py-0.5 text-center text-[0.68rem] font-semibold text-[var(--paper)]">
          {law.assumedToday && !law.picked ? "Today" : formatLongDate(law.date)}
        </p>
        <div className="mx-auto h-[14px] w-[14px] rounded-full border-[3px] border-[var(--paper)] bg-[var(--ink)] shadow" />
      </div>
    </div>
  );
}

type Props = {
  law: LawVersion;
  onDate?: (iso: string) => void;
  /** "sentence" and "graphic" split the timeline in two: on a phone the track moves below the contract. */
  part?: "all" | "sentence" | "graphic";
};

/** The law timeline: three versions of the LAU and a marker on the signing date (prd.md > Law Version and Timeline). */
export function Timeline({ law, onDate, part = "all" }: Props) {
  const today = isoToday();

  if (part === "graphic")
    return (
      <div className="grid gap-1" aria-hidden="true">
        <p className={TRACK_CAPTION}>The law this contract was checked against</p>
        <Track law={law} />
      </div>
    );

  return (
    <section aria-label="Which version of the law applies" className="grid gap-3">
      <p className="text-[0.95rem]">
        <span className="font-semibold">
          {law.picked ? `You picked ${formatLongDate(law.date)}` : law.assumedToday ? "No signing date" : `Signed ${formatLongDate(law.date)}`}
        </span>
        <span className="text-ink-2"> → </span>
        <span>{law.sentence.split("→ ")[1]}</span>
      </p>

      {part === "all" ? <Track law={law} /> : null}
      <p className="sr-only">
        Milestones: March 2019, May 2023, and the October 2026 reform, which is pending a vote in Congress. {law.sentence}.
      </p>

      {law.assumedToday && onDate ? (
        <div className="grid gap-2 rounded-[3px] border border-[var(--hairline)] bg-paper px-4 py-3 sm:flex sm:items-center sm:justify-between lg:grid">
          <p className="text-[0.9rem]">
            {law.picked
              ? `No signing date in the contract: checked against the law on the date you picked, ${formatLongDate(law.date)}.`
              : `No signing date found: checked against the law in force today, ${formatLongDate(today)}.`}
          </p>
          <label className="flex items-center gap-2 text-[0.85rem] font-medium">
            {law.picked ? "Change the date" : "Signed on another date?"}
            <input
              type="date"
              min="2019-03-06"
              max={today}
              defaultValue={law.picked ? law.date : ""}
              onChange={(e) => e.target.value && onDate(e.target.value)}
              className="rounded-md border border-[var(--hairline)] bg-[var(--bg)] px-2 py-1 text-[0.85rem]"
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
