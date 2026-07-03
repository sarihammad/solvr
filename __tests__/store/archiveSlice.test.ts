import archiveReducer, {
  addArchiveItem,
  removeArchiveItem,
  setSearchQuery,
  clearArchive,
} from '../../src/store/archiveSlice';
import { ArchiveItem, SolveSession } from '../../src/types';

const makeItem = (overrides: Partial<ArchiveItem> = {}): ArchiveItem => ({
  id: 'item-1',
  mode: 'solve_problem',
  subject: 'physics',
  concepts: ['kinematics'],
  problemImageUri: 'file://photo.jpg',
  finalAnswer: 'H ≈ 2.87 m',
  verified: true,
  stepCount: 5,
  createdAt: new Date().toISOString(),
  preview: 'For projectile motion...',
  ...overrides,
});

const makeSession = (id: string): SolveSession => ({
  id,
  mode: 'solve_problem',
  subject: 'physics',
  concepts: ['kinematics'],
  problemImageUri: 'file://photo.jpg',
  steps: [],
  finalAnswer: 'H ≈ 2.87 m',
  verified: true,
  chatHistory: [],
  createdAt: new Date().toISOString(),
  savedToArchive: true,
});

describe('archiveSlice', () => {
  const initial = archiveReducer(undefined, { type: '@@INIT' });

  it('starts empty', () => {
    expect(initial.items).toHaveLength(0);
    expect(initial.sessions).toEqual({});
    expect(initial.subjectSummaries).toHaveLength(0);
  });

  it('addArchiveItem stores item and full session', () => {
    const item = makeItem();
    const session = makeSession('item-1');
    const state = archiveReducer(initial, addArchiveItem({ item, session }));

    expect(state.items).toHaveLength(1);
    expect(state.sessions['item-1']).toEqual(session);
  });

  it('addArchiveItem prevents duplicate entries', () => {
    const item = makeItem();
    const session = makeSession('item-1');
    let state = archiveReducer(initial, addArchiveItem({ item, session }));
    state = archiveReducer(state, addArchiveItem({ item, session }));
    expect(state.items).toHaveLength(1);
  });

  it('addArchiveItem prepends (most recent first)', () => {
    const item1 = makeItem({ id: 'a', createdAt: '2024-01-01T00:00:00Z' });
    const item2 = makeItem({ id: 'b', createdAt: '2024-01-02T00:00:00Z' });
    let state = archiveReducer(initial, addArchiveItem({ item: item1, session: makeSession('a') }));
    state = archiveReducer(state, addArchiveItem({ item: item2, session: makeSession('b') }));
    expect(state.items[0].id).toBe('b');
  });

  it('removeArchiveItem removes item and session', () => {
    const item = makeItem();
    let state = archiveReducer(initial, addArchiveItem({ item, session: makeSession('item-1') }));
    state = archiveReducer(state, removeArchiveItem('item-1'));

    expect(state.items).toHaveLength(0);
    expect(state.sessions['item-1']).toBeUndefined();
  });

  it('builds subjectSummaries correctly', () => {
    const physics = makeItem({ id: 'p1', subject: 'physics' });
    const math = makeItem({ id: 'm1', subject: 'math' });
    const mistakeMath = makeItem({ id: 'm2', subject: 'math', mode: 'mistake_detective' });

    let state = archiveReducer(initial, addArchiveItem({ item: physics, session: makeSession('p1') }));
    state = archiveReducer(state, addArchiveItem({ item: math, session: makeSession('m1') }));
    state = archiveReducer(state, addArchiveItem({ item: mistakeMath, session: makeSession('m2') }));

    const mathSummary = state.subjectSummaries.find((s) => s.subject === 'math');
    expect(mathSummary?.count).toBe(2);
    expect(mathSummary?.mistakeCount).toBe(1);

    const physicsSummary = state.subjectSummaries.find((s) => s.subject === 'physics');
    expect(physicsSummary?.count).toBe(1);
    expect(physicsSummary?.mistakeCount).toBe(0);
  });

  it('builds the concept Weakness Graph, ranking mistaken concepts first', () => {
    const cleanSolve = makeItem({ id: 'w1', subject: 'math', concepts: ['power-rule'] });
    const mistake = makeItem({
      id: 'w2',
      subject: 'math',
      mode: 'mistake_detective',
      concepts: ['power-rule', 'integration'],
    });

    let state = archiveReducer(initial, addArchiveItem({ item: cleanSolve, session: makeSession('w1') }));
    state = archiveReducer(state, addArchiveItem({ item: mistake, session: makeSession('w2') }));

    const powerRule = state.conceptWeaknesses.find((w) => w.concept === 'power-rule');
    expect(powerRule?.seenCount).toBe(2);
    expect(powerRule?.mistakeCount).toBe(1);
    // Concepts with mistakes rank ahead of clean-only concepts.
    expect(state.conceptWeaknesses[0].mistakeCount).toBeGreaterThan(0);
  });

  it('setSearchQuery updates the query', () => {
    const state = archiveReducer(initial, setSearchQuery('calculus'));
    expect(state.searchQuery).toBe('calculus');
  });

  it('clearArchive resets everything', () => {
    const item = makeItem();
    let state = archiveReducer(initial, addArchiveItem({ item, session: makeSession('item-1') }));
    state = archiveReducer(state, clearArchive());

    expect(state.items).toHaveLength(0);
    expect(Object.keys(state.sessions)).toHaveLength(0);
  });
});
