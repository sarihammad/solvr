import solveReducer, {
  startSolve,
  solveComplete,
  solveFailed,
  appendChatMessage,
  markSaved,
  clearSolve,
} from '../../src/store/solveSlice';
import { SolveSession, ChatMessage } from '../../src/types';

const makeSession = (): SolveSession => ({
  id: 'sess-1',
  mode: 'solve_problem',
  subject: 'math',
  concepts: ['power-rule'],
  problemImageUri: 'file://img.jpg',
  steps: [],
  finalAnswer: '9',
  verified: true,
  chatHistory: [],
  createdAt: new Date().toISOString(),
  savedToArchive: false,
});

const makeMessage = (role: 'user' | 'assistant'): ChatMessage => ({
  id: 'msg-1',
  role,
  content: 'test message',
  timestamp: new Date().toISOString(),
});

describe('solveSlice', () => {
  const initial = solveReducer(undefined, { type: '@@INIT' });

  it('starts idle with no current session', () => {
    expect(initial.status).toBe('idle');
    expect(initial.current).toBeNull();
    expect(initial.error).toBeNull();
  });

  it('startSolve sets status to processing and clears error', () => {
    const withError = solveReducer(initial, solveFailed('oops'));
    const state = solveReducer(withError, startSolve());
    expect(state.status).toBe('processing');
    expect(state.error).toBeNull();
  });

  it('solveComplete stores the session and sets status complete', () => {
    const session = makeSession();
    const state = solveReducer(initial, solveComplete(session));
    expect(state.status).toBe('complete');
    expect(state.current).toEqual(session);
  });

  it('solveFailed records the error message', () => {
    const state = solveReducer(initial, solveFailed('Network timeout'));
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network timeout');
  });

  it('appendChatMessage adds message to current session history', () => {
    const session = makeSession();
    let state = solveReducer(initial, solveComplete(session));
    state = solveReducer(state, appendChatMessage(makeMessage('user')));
    expect(state.current?.chatHistory).toHaveLength(1);
    expect(state.current?.chatHistory[0].role).toBe('user');
  });

  it('appendChatMessage is a no-op when current is null', () => {
    const state = solveReducer(initial, appendChatMessage(makeMessage('user')));
    expect(state.current).toBeNull();
  });

  it('markSaved sets savedToArchive on current session', () => {
    const session = makeSession();
    let state = solveReducer(initial, solveComplete(session));
    state = solveReducer(state, markSaved());
    expect(state.current?.savedToArchive).toBe(true);
  });

  it('clearSolve resets everything to idle', () => {
    const session = makeSession();
    let state = solveReducer(initial, solveComplete(session));
    state = solveReducer(state, clearSolve());
    expect(state.status).toBe('idle');
    expect(state.current).toBeNull();
  });
});
