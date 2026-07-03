import { buildConceptWeaknesses, computeWeeklyReport } from '../../src/lib/weakness';
import { ArchiveItem } from '../../src/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-06-15T12:00:00Z').getTime();

const makeItem = (overrides: Partial<ArchiveItem> = {}): ArchiveItem => ({
  id: 'item',
  mode: 'solve_problem',
  subject: 'math',
  concepts: ['power-rule'],
  problemImageUri: 'file://x.jpg',
  finalAnswer: '9',
  verified: true,
  stepCount: 3,
  createdAt: new Date(NOW).toISOString(),
  preview: '',
  ...overrides,
});

describe('buildConceptWeaknesses', () => {
  it('ranks concepts with mistakes above clean-only concepts', () => {
    const items = [
      makeItem({ id: 'a', concepts: ['clean-concept'] }),
      makeItem({ id: 'b', concepts: ['weak-concept'], mode: 'mistake_detective' }),
    ];
    const weaknesses = buildConceptWeaknesses(items);
    expect(weaknesses[0].concept).toBe('weak-concept');
    expect(weaknesses[0].mistakeCount).toBe(1);
  });
});

describe('computeWeeklyReport', () => {
  it('excludes items older than 7 days from the weekly count', () => {
    const items = [
      makeItem({ id: 'recent', createdAt: new Date(NOW - 2 * DAY_MS).toISOString() }),
      makeItem({ id: 'stale', createdAt: new Date(NOW - 10 * DAY_MS).toISOString() }),
    ];
    const report = computeWeeklyReport(items, NOW);
    expect(report.solveCount).toBe(1);
  });

  it('only surfaces concepts with at least one mistake this week', () => {
    const items = [
      makeItem({ id: 'a', concepts: ['clean'], createdAt: new Date(NOW - 1 * DAY_MS).toISOString() }),
      makeItem({
        id: 'b',
        concepts: ['weak'],
        mode: 'mistake_detective',
        createdAt: new Date(NOW - 1 * DAY_MS).toISOString(),
      }),
    ];
    const report = computeWeeklyReport(items, NOW);
    expect(report.topWeaknesses).toHaveLength(1);
    expect(report.topWeaknesses[0].concept).toBe('weak');
  });

  it('caps the report at the top 3 weakest concepts', () => {
    const items = ['a', 'b', 'c', 'd'].map((c, i) =>
      makeItem({
        id: `item-${i}`,
        concepts: [c],
        mode: 'mistake_detective',
        createdAt: new Date(NOW - 1 * DAY_MS).toISOString(),
      }),
    );
    const report = computeWeeklyReport(items, NOW);
    expect(report.topWeaknesses.length).toBeLessThanOrEqual(3);
  });

  it('ignores mistakes from more than 7 days ago', () => {
    const items = [
      makeItem({
        id: 'old-mistake',
        concepts: ['forgotten'],
        mode: 'mistake_detective',
        createdAt: new Date(NOW - 8 * DAY_MS).toISOString(),
      }),
    ];
    const report = computeWeeklyReport(items, NOW);
    expect(report.topWeaknesses).toHaveLength(0);
    expect(report.solveCount).toBe(0);
  });
});
