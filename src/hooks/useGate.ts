import { useAppSelector } from '../store';
import { SubscriptionTier, PaywallTrigger, Subject } from '../types';
import { TIERS } from '../constants/tiers';

interface GateResult {
  allowed: boolean;
  trigger: PaywallTrigger | null;
}

// Entitlement gates. Everything defensible (Mistake Detective, exports, all
// subjects) sits behind Pro / Exam Boost — see PLAN.md §7.
const PAID_TIERS: SubscriptionTier[] = ['pro', 'exam_boost'];

export function useGate() {
  const { tier, dailySolvesUsed, dailySolvesLimit } = useAppSelector((s) => s.subscription);

  function checkSolve(): GateResult {
    if (tier === 'free' && dailySolvesUsed >= dailySolvesLimit) {
      return { allowed: false, trigger: 'daily_limit' };
    }
    return { allowed: true, trigger: null };
  }

  function checkMistakeDetective(): GateResult {
    if (!PAID_TIERS.includes(tier)) {
      return { allowed: false, trigger: 'mistake_detective' };
    }
    return { allowed: true, trigger: null };
  }

  function checkExport(): GateResult {
    if (tier === 'free') {
      return { allowed: false, trigger: 'export' };
    }
    return { allowed: true, trigger: null };
  }

  // Practice problems are part of the retention pillar (PLAN.md v1.5) and
  // live inside Pro/Exam Boost alongside Mistake Detective and analytics.
  function checkPractice(): GateResult {
    if (!TIERS[tier].practiceProblems) {
      return { allowed: false, trigger: 'practice' };
    }
    return { allowed: true, trigger: null };
  }

  // Free tier is math-only. The real backend enforces this after the router
  // classifies the subject; the client uses this to gate a request it already
  // knows is out of scope.
  function checkSubject(subject: Subject): GateResult {
    const allowed = TIERS[tier].subjects;
    if (allowed !== 'all' && !allowed.includes(subject)) {
      return { allowed: false, trigger: 'locked_subject' };
    }
    return { allowed: true, trigger: null };
  }

  return { tier, checkSolve, checkMistakeDetective, checkExport, checkSubject, checkPractice };
}
