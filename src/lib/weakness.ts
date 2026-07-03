import { ArchiveItem, ConceptWeakness } from '../types';

// The retention engine (PLAN.md §5): tag every solve by concept, then rank the
// concepts that keep showing up in the student's mistakes. Shared by
// archiveSlice (all-time Weakness Graph) and computeWeeklyReport (last-7-days
// slice) so both stay consistent with one implementation.
export function buildConceptWeaknesses(items: ArchiveItem[]): ConceptWeakness[] {
  const map = new Map<string, ConceptWeakness>();
  for (const item of items) {
    for (const concept of item.concepts ?? []) {
      const entry =
        map.get(concept) ?? { concept, subject: item.subject, mistakeCount: 0, seenCount: 0 };
      entry.seenCount += 1;
      if (item.mode === 'mistake_detective') entry.mistakeCount += 1;
      map.set(concept, entry);
    }
  }
  return [...map.values()].sort(
    (a, b) => b.mistakeCount - a.mistakeCount || b.seenCount - a.seenCount,
  );
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_REPORT_TOP_N = 3;

export interface WeeklyReport {
  solveCount: number;
  /** Top concepts by mistake count, scoped to the last 7 days — "here's what
   * you keep getting wrong this week" (PLAN.md v1.5). */
  topWeaknesses: ConceptWeakness[];
}

/** Pure so it's directly testable without rendering a hook (this project has
 * no React Testing Library setup — see useWeeklyReport.ts, which is a thin
 * useAppSelector + useMemo wrapper around this). */
export function computeWeeklyReport(items: ArchiveItem[], now: number = Date.now()): WeeklyReport {
  const cutoff = now - SEVEN_DAYS_MS;
  const recentItems = items.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
  const topWeaknesses = buildConceptWeaknesses(recentItems)
    .filter((w) => w.mistakeCount > 0)
    .slice(0, WEEKLY_REPORT_TOP_N);

  return { solveCount: recentItems.length, topWeaknesses };
}
