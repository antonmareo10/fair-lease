"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { NoteGroup } from "@/lib/groups";
import type { Lang } from "./FindingNote";
import { NoteCard } from "./NoteCard";

type Props = {
  groups: NoteGroup[];
  /** Vertical offset of each group's first highlight, relative to the sheet's top. */
  anchors: Record<string, number>;
  activeKey: string | null;
  openFindingId: string | null;
  onOpenFinding: (id: string) => void;
  lang: Lang;
  onLang: (l: Lang) => void;
  onCopy: (text: string) => void;
  onOpen: (key: string) => void;
};

const GAP = 10;

/** Desktop margin: each note sits next to its clause, pushed down only when it would overlap the one above. */
export function MarginNotes({ groups, anchors, activeKey, openFindingId, onOpenFinding, lang, onLang, onCopy, onOpen }: Props) {
  const refs = useRef(new Map<string, HTMLDivElement>());
  const [tops, setTops] = useState<Record<string, number>>({});
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const layout = () => {
      let cursor = 0;
      const next: Record<string, number> = {};
      for (const g of groups) {
        const el = refs.current.get(g.key);
        const h = el?.offsetHeight ?? 0;
        const want = Math.max(0, (anchors[g.key] ?? cursor) - 12);
        const top = Math.max(want, cursor);
        next[g.key] = top;
        cursor = top + h + GAP;
      }
      setTops((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      setHeight(cursor);
    };
    layout();
    const ro = new ResizeObserver(layout);
    refs.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [groups, anchors, activeKey, openFindingId, lang]);

  return (
    <div className="relative" style={{ minHeight: height }} aria-label="Findings" role="region">
      {groups.map((g) => (
        <NoteCard
          key={g.key}
          ref={(el) => {
            if (el) refs.current.set(g.key, el);
            else refs.current.delete(g.key);
          }}
          group={g}
          active={g.key === activeKey}
          openFindingId={openFindingId}
          onOpenFinding={onOpenFinding}
          lang={lang}
          onLang={onLang}
          onCopy={onCopy}
          onOpen={() => onOpen(g.key)}
          style={{ position: "absolute", left: 0, right: 0, top: tops[g.key] ?? 0, transition: "top 420ms var(--ease)" }}
        />
      ))}
    </div>
  );
}
