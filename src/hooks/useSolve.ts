import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { startSolve, solveComplete, solveFailed, appendChatMessage, markSaved, clearSolve } from '../store/solveSlice';
import { addArchiveItem } from '../store/archiveSlice';
import { incrementDailySolves } from '../store/subscriptionSlice';
import { api, LockedSubjectError } from '../lib/api';
import { TIERS } from '../constants/tiers';
import { SolveMode } from '../types';

export function useSolve() {
  const dispatch = useAppDispatch();
  const { current, status, error } = useAppSelector((s) => s.solve);
  const { tier, dailySolvesUsed, dailySolvesLimit } = useAppSelector((s) => s.subscription);

  const canSolve = tier !== 'free' || dailySolvesUsed < dailySolvesLimit;

  const solve = useCallback(
    async (mode: SolveMode, problemImageUri: string, workImageUri?: string) => {
      dispatch(startSolve());
      dispatch(incrementDailySolves());
      // Free tier is math-only; scope the router so it never serves an
      // out-of-plan subject. Paid tiers get everything.
      const allowedSubjects = TIERS[tier].subjects;
      const subjectScope = allowedSubjects === 'all' ? undefined : allowedSubjects;
      try {
        const session = await api.solve(mode, problemImageUri, workImageUri, { subjectScope });
        dispatch(solveComplete(session));
        return session;
      } catch (e: any) {
        dispatch(solveFailed(e?.message ?? 'Solve failed'));
        // The backend enforces plan-subject scope independently of the
        // client (PLAN.md §7) — rethrow so the caller can route to Paywall
        // instead of just failing silently.
        if (e instanceof LockedSubjectError) throw e;
        return null;
      }
    },
    [dispatch, tier],
  );

  const sendChat = useCallback(
    async (message: string) => {
      if (!current) return '';
      const userMsg = {
        id: Math.random().toString(36).slice(2),
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString(),
      };
      dispatch(appendChatMessage(userMsg));

      const reply = await api.chat(current.id, message, current.chatHistory);
      const assistantMsg = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant' as const,
        content: reply,
        timestamp: new Date().toISOString(),
      };
      dispatch(appendChatMessage(assistantMsg));
      return reply;
    },
    [current, dispatch],
  );

  const saveToArchive = useCallback(() => {
    if (!current || current.savedToArchive) return;
    dispatch(
      addArchiveItem({
        item: {
          id: current.id,
          mode: current.mode,
          subject: current.subject,
          concepts: current.concepts,
          problemImageUri: current.problemImageUri,
          finalAnswer: current.finalAnswer,
          verified: current.verified,
          stepCount: current.steps.length,
          createdAt: current.createdAt,
          preview: current.steps[0]?.explanation ?? '',
        },
        session: current,
      }),
    );
    dispatch(markSaved());
  }, [current, dispatch]);

  const reset = useCallback(() => dispatch(clearSolve()), [dispatch]);

  return { current, status, error, canSolve, solve, sendChat, saveToArchive, reset };
}
