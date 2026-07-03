export type SolveMode = 'solve_problem' | 'mistake_detective';

export type Subject =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'economics'
  | 'cs'
  | 'other';

// ── Subscription model ────────────────────────────────────────────────────────
// Three plans (see PLAN.md §7): Free (acquisition), Pro (the one subscription),
// Exam Boost (a 7-day consumable for finals-week intent spikes). Mistake
// Detective and analytics live INSIDE Pro — never as cheaper standalone SKUs.

export type SubscriptionTier = 'free' | 'pro' | 'exam_boost';

export type PaywallTrigger =
  | 'daily_limit'
  | 'pro_feature'
  | 'mistake_detective'
  | 'export'
  | 'locked_subject'
  | 'practice';

export interface BillingOption {
  price: string; // display string, e.g. "$11.99"
  interval: string; // e.g. "/mo", "/yr", "/ 7-day pass"
  revenuecat_id: string;
  note?: string; // e.g. "Save 58%"
}

export interface TierConfig {
  id: SubscriptionTier;
  label: string;
  tagline: string;
  features: string[];
  /** Purchase options. Multiple entries (e.g. monthly + annual) render a toggle. */
  billing: BillingOption[];
  /** null = unlimited. Free = 3/day. */
  dailySolveLimit: number | null;
  subjects: Subject[] | 'all';
  mistakeDetector: boolean;
  exports: boolean;
  practiceProblems: boolean;
  analytics: boolean;
  priority: boolean;
  /** Visually emphasise this plan on the paywall (Pro). */
  highlight?: boolean;
  /** Free trial length for this plan's billing options, if any (Pro only —
   * offered once at onboarding via TrialPaywallScreen). Actual trial
   * eligibility/terms are configured on the store product (App Store
   * Connect / Play Console) and surfaced through RevenueCat; this only
   * drives the UI copy. */
  trialDays?: number;
}

// ── Solve pipeline / router ───────────────────────────────────────────────────
// The backend routes each request through the cheapest engine that can handle
// it, escalating to Opus only when reasoning demands it (see PLAN.md §9.1–9.3).
// The mock in src/lib/api.ts implements this ladder so the real swap is faithful.

export type SolveEngine =
  | 'cache' // shared problem cache hit — ~$0
  | 'rule_based' // deterministic solver, no LLM
  | 'haiku' // cheap model: classification + simple solves
  | 'opus'; // reasoning model: hard solves + Mistake Detective

export interface RoutingDecision {
  subject: Subject;
  complexity: 'trivial' | 'standard' | 'complex';
  /** Cheapest engine that can handle the request. */
  engine: SolveEngine;
  /** Whether the answer is confirmed in the Python sandbox. */
  verify: boolean;
  cacheHit: boolean;
  /** Human-readable justification — surfaced in logs and the reasoning console. */
  reason: string;
  /** Rough per-request cost estimate in cents (the point of routing). */
  estimatedCostCents: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'failed';

export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'failed';
}

export interface SolutionStep {
  id: string;
  stepNumber: number;
  title: string;
  explanation: string;
  equation?: string;
  isKeyStep?: boolean;
}

export interface MistakeAnalysis {
  divergenceStep: number;
  studentWork: string;
  correctWork: string;
  mistakeLabel: string;
  /** Error taxonomy — drives the Weakness Graph. */
  errorClass: 'conceptual' | 'arithmetic' | 'sign' | 'setup' | 'units';
  explanation: string;
  conceptualNote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601 string — keeps Redux state serializable
}

export interface SolveSession {
  id: string;
  mode: SolveMode;
  subject: Subject;
  /** Concept tags — the edges of the Weakness Graph. */
  concepts: string[];
  problemImageUri: string;
  workImageUri?: string;
  steps: SolutionStep[];
  mistakeAnalysis?: MistakeAnalysis;
  finalAnswer: string;
  verified: boolean;
  /** How the request was routed (which engine, cache, verification). */
  routing?: RoutingDecision;
  chatHistory: ChatMessage[];
  createdAt: string;
  savedToArchive: boolean;
}

export interface ArchiveItem {
  id: string;
  mode: SolveMode;
  subject: Subject;
  concepts: string[];
  problemImageUri: string;
  finalAnswer: string;
  verified: boolean;
  stepCount: number;
  createdAt: string;
  preview: string;
}

export interface SubjectSummary {
  subject: Subject;
  count: number;
  mistakeCount: number;
}

/** A weak concept inferred from the student's mistakes — the retention hook. */
export interface ConceptWeakness {
  concept: string;
  subject: Subject;
  /** How many times this concept showed up in a detected mistake. */
  mistakeCount: number;
  /** Total times seen (mistakes + clean solves). */
  seenCount: number;
}

/** A generated practice problem targeting one weak concept (PLAN.md v1.5:
 * the Weakness Graph → Practice loop). Self-graded client-side: the student
 * types an answer, it's checked loosely against `expectedAnswer`, and
 * `explanation` is always available as a fallback ("show solution"). */
export interface PracticeProblem {
  id: string;
  concept: string;
  subject: Subject;
  question: string;
  expectedAnswer: string;
  hint: string;
  explanation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
