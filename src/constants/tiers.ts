import { TierConfig } from '../types';

// Three plans (PLAN.md §7). The whole moat — Mistake Detective, the Weakness
// Graph, verified solves — lives inside Pro. Free exists to acquire and to feed
// the share loop; Exam Boost monetises finals-week intent and on-ramps to Pro.

export const TIERS: Record<string, TierConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    tagline: 'Get started, no commitment',
    features: [
      '3 verified solves per day',
      'Math only',
      'Step-by-step verified solutions',
      'Shareable solutions (watermarked)',
    ],
    billing: [{ price: '$0', interval: '', revenuecat_id: 'free' }],
    dailySolveLimit: 3,
    subjects: ['math'],
    mistakeDetector: false,
    exports: false,
    practiceProblems: false,
    analytics: false,
    priority: false,
  },
  pro: {
    id: 'pro',
    label: 'Solvr Pro',
    tagline: 'Understand exactly where you go wrong',
    features: [
      'Unlimited verified solves',
      'All STEM subjects (math, physics, chemistry)',
      'Mistake Detective — pinpoint your exact error',
      'Ask Solvr follow-up chat',
      'Weakness Graph + targeted practice',
      'Clean PDF & Markdown exports',
    ],
    // Annual is where LTV lives — it is listed first and marked as the saver.
    billing: [
      { price: '$59.99', interval: '/yr', revenuecat_id: 'pro_annual', note: 'Save 58%' },
      { price: '$11.99', interval: '/mo', revenuecat_id: 'pro_monthly' },
    ],
    dailySolveLimit: null,
    subjects: 'all',
    mistakeDetector: true,
    exports: true,
    practiceProblems: true,
    analytics: true,
    priority: false,
    highlight: true,
    trialDays: 7,
  },
  exam_boost: {
    id: 'exam_boost',
    label: 'Exam Boost',
    tagline: 'Everything in Pro for 7 days',
    features: [
      'Everything in Pro, for 7 days',
      'Priority processing queue',
      'Mistake Detective included',
      'Built for finals week',
    ],
    billing: [{ price: '$6.99', interval: '/ 7-day pass', revenuecat_id: 'exam_boost_pass' }],
    dailySolveLimit: null,
    subjects: 'all',
    mistakeDetector: true,
    exports: true,
    practiceProblems: true,
    analytics: true,
    priority: true,
  },
};

export const TIER_ORDER: TierConfig['id'][] = ['free', 'pro', 'exam_boost'];
