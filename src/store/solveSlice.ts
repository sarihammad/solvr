import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SolveSession, ProcessingStatus, ChatMessage } from '../types';

interface SolveState {
  current: SolveSession | null;
  status: ProcessingStatus;
  error: string | null;
}

const initialState: SolveState = {
  current: null,
  status: 'idle',
  error: null,
};

const solveSlice = createSlice({
  name: 'solve',
  initialState,
  reducers: {
    startSolve(state) {
      state.status = 'processing';
      state.current = null;
      state.error = null;
    },
    solveComplete(state, action: PayloadAction<SolveSession>) {
      state.status = 'complete';
      state.current = action.payload;
    },
    solveFailed(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },
    appendChatMessage(state, action: PayloadAction<ChatMessage>) {
      if (state.current) {
        state.current.chatHistory.push(action.payload);
      }
    },
    markSaved(state) {
      if (state.current) {
        state.current.savedToArchive = true;
      }
    },
    clearSolve(state) {
      state.current = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const { startSolve, solveComplete, solveFailed, appendChatMessage, markSaved, clearSolve } =
  solveSlice.actions;
export default solveSlice.reducer;
