import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ArchiveItem, Subject, SubjectSummary, SolveSession, ConceptWeakness } from '../types';
import { buildConceptWeaknesses } from '../lib/weakness';

interface ArchiveState {
  items: ArchiveItem[];
  sessions: Record<string, SolveSession>; // full session data keyed by id
  subjectSummaries: SubjectSummary[];
  /** The Weakness Graph: concepts ranked by how often they trip the student up. */
  conceptWeaknesses: ConceptWeakness[];
  searchQuery: string;
}

const initialState: ArchiveState = {
  items: [],
  sessions: {},
  subjectSummaries: [],
  conceptWeaknesses: [],
  searchQuery: '',
};

function buildSummaries(items: ArchiveItem[]): SubjectSummary[] {
  const map: Record<Subject, { count: number; mistakeCount: number }> = {} as any;
  for (const item of items) {
    if (!map[item.subject]) map[item.subject] = { count: 0, mistakeCount: 0 };
    map[item.subject].count += 1;
    if (item.mode === 'mistake_detective') map[item.subject].mistakeCount += 1;
  }
  return Object.entries(map).map(([subject, data]) => ({
    subject: subject as Subject,
    ...data,
  }));
}

const archiveSlice = createSlice({
  name: 'archive',
  initialState,
  reducers: {
    addArchiveItem(state, action: PayloadAction<{ item: ArchiveItem; session: SolveSession }>) {
      const { item, session } = action.payload;
      // prevent duplicates
      if (state.sessions[item.id]) return;
      state.items.unshift(item);
      state.sessions[item.id] = session;
      state.subjectSummaries = buildSummaries(state.items);
      state.conceptWeaknesses = buildConceptWeaknesses(state.items);
    },
    removeArchiveItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      delete state.sessions[action.payload];
      state.subjectSummaries = buildSummaries(state.items);
      state.conceptWeaknesses = buildConceptWeaknesses(state.items);
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    clearArchive(state) {
      state.items = [];
      state.sessions = {};
      state.subjectSummaries = [];
      state.conceptWeaknesses = [];
    },
  },
});

export const { addArchiveItem, removeArchiveItem, setSearchQuery, clearArchive } =
  archiveSlice.actions;
export default archiveSlice.reducer;
