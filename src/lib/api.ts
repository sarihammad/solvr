import axios, { AxiosError } from 'axios';
import { File } from 'expo-file-system';
import { SolveMode, Subject, SolveSession, ChatMessage, RoutingDecision, PracticeProblem } from '../types';
import * as mock from './mockApi';
import { SolveOptions } from './mockApi';

// Set EXPO_PUBLIC_API_BASE_URL to point the app at the real backend (see
// backend/README.md). Unset — the default — falls back to the local mock so
// the app runs fully offline in dev. Must be a static `process.env.X` access
// for Expo's env-var inlining to pick it up (no bracket access, no destructuring).
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

// Must match the backend's SOLVR_APP_KEY exactly, or every request 401s once
// the backend has one configured (see backend/README.md § Security). This is
// a shared app-level secret, not per-user auth — it's extractable from the
// built app binary, so it only deters anonymous/automated abuse.
const BACKEND_API_KEY = process.env.EXPO_PUBLIC_BACKEND_API_KEY;

const client = axios.create({
  baseURL: API_BASE,
  headers: BACKEND_API_KEY ? { Authorization: `Bearer ${BACKEND_API_KEY}` } : {},
});

/** Thrown when the backend rejects a subject outside the caller's plan
 * (PLAN.md §7: free tier is math-only) — enforced server-side, not just in
 * the client's useGate(). Callers should route this to the Paywall screen. */
export class LockedSubjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockedSubjectError';
  }
}

async function uriToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}

function rethrowLockedSubject(error: unknown): never {
  const axiosError = error as AxiosError<{ detail?: { error?: string; message?: string } }>;
  if (axiosError.response?.status === 403 && axiosError.response.data?.detail?.error === 'locked_subject') {
    throw new LockedSubjectError(axiosError.response.data.detail.message ?? 'Subject not in plan');
  }
  throw error;
}

async function realRoute(
  mode: SolveMode,
  problemImageUri: string,
  workImageUri?: string,
  opts?: SolveOptions,
): Promise<RoutingDecision> {
  const problemImageBase64 = await uriToBase64(problemImageUri);
  const workImageBase64 = workImageUri ? await uriToBase64(workImageUri) : undefined;
  try {
    const { data } = await client.post<RoutingDecision>('/route', {
      mode,
      problemImageBase64,
      workImageBase64,
      subjectScope: opts?.subjectScope,
    });
    return data;
  } catch (error) {
    rethrowLockedSubject(error);
  }
}

async function realSolve(
  mode: SolveMode,
  problemImageUri: string,
  workImageUri?: string,
  opts?: SolveOptions,
): Promise<SolveSession> {
  const problemImageBase64 = await uriToBase64(problemImageUri);
  const workImageBase64 = workImageUri ? await uriToBase64(workImageUri) : undefined;
  try {
    const { data } = await client.post('/solve', {
      mode,
      problemImageBase64,
      workImageBase64,
      subjectScope: opts?.subjectScope,
    });
    // The backend never sees the client's local file URI (only base64 bytes)
    // — merge it back in here so the rest of the app can keep displaying it.
    return {
      ...data,
      problemImageUri,
      workImageUri,
      chatHistory: [],
      savedToArchive: false,
    } as SolveSession;
  } catch (error) {
    rethrowLockedSubject(error);
  }
}

async function realChat(sessionId: string, message: string, history: ChatMessage[]): Promise<string> {
  const { data } = await client.post<{ reply: string }>('/chat', {
    sessionId,
    message,
    history,
  });
  return data.reply;
}

async function realPractice(concept: string, subject: Subject): Promise<PracticeProblem> {
  const { data } = await client.post<PracticeProblem>('/practice', { concept, subject });
  return data;
}

export const api = {
  route: API_BASE ? realRoute : mock.route,
  solve: API_BASE ? realSolve : mock.solve,
  chat: API_BASE ? realChat : mock.chat,
  practice: API_BASE ? realPractice : mock.practice,
};
