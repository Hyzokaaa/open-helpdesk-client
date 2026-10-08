import { useState } from "react";
import type { RetentionDraftRow } from "../components/RetentionRow";

type Days = Record<string, number | null>;
type Draft = Record<string, RetentionDraftRow>;

function toDraft(days: Days): Draft {
  return Object.fromEntries(Object.entries(days).map(([c, d]) => [c, { value: d === null ? "" : String(d), forever: d === null }]));
}

function differs(a: RetentionDraftRow | undefined, b: RetentionDraftRow | undefined): boolean {
  if (a?.forever !== b?.forever) return true;
  return !a?.forever && a?.value !== b?.value;
}

/** The days being edited in a retention panel, and which categories differ from what was loaded. */
export default function useRetentionDraft() {
  const [initial, setInitial] = useState<Draft>({});
  const [draft, setDraft] = useState<Draft>({});

  return {
    draft,
    /** Starts over from what the server holds. */
    reset: (days: Days) => {
      const loaded = toDraft(days);
      setInitial(loaded);
      setDraft(loaded);
    },
    isChanged: (category: string) => differs(draft[category], initial[category]),
    setValue: (category: string, value: string) => setDraft((d) => ({ ...d, [category]: { value, forever: false } })),
    /** Unticking forever brings back the days typed before, or the fallback when there were none. */
    setForever: (category: string, forever: boolean, fallback: number) =>
      setDraft((d) => ({ ...d, [category]: { value: d[category]?.value || String(fallback), forever } })),
    daysOf: (category: string): number | null => (draft[category]?.forever ? null : Number(draft[category]?.value)),
  };
}
