import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { computeWeeklyReport, WeeklyReport } from '../lib/weakness';

export function useWeeklyReport(): WeeklyReport {
  const items = useAppSelector((s) => s.archive.items);
  return useMemo(() => computeWeeklyReport(items), [items]);
}
