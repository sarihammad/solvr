import {
  SolveMode,
  Subject,
  SolveSession,
  ChatMessage,
  SolutionStep,
  MistakeAnalysis,
  RoutingDecision,
  SolveEngine,
  PracticeProblem,
} from '../types';

const MOCK_DELAY = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let solveCounter = 0;

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Problem bank ──────────────────────────────────────────────────────────────

interface MockProblem {
  subject: Subject;
  concepts: string[];
  /** Drives the router's engine choice (see decideEngine). */
  difficulty: 'trivial' | 'standard' | 'complex';
  steps: SolutionStep[];
  finalAnswer: string;
  mistakeAnalysis: MistakeAnalysis;
  chatResponses: Record<string, string>;
}

const PROBLEMS: MockProblem[] = [
  // 0 — Physics: projectile motion  (complex → Opus)
  {
    subject: 'physics',
    concepts: ['kinematics', 'projectile-motion', 'trigonometry'],
    difficulty: 'complex',
    steps: [
      {
        id: 's1', stepNumber: 1,
        title: 'Identify the formula',
        explanation: 'For projectile motion, maximum height depends only on the vertical velocity component. We use kinematics.',
        equation: 'H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}',
        isKeyStep: true,
      },
      {
        id: 's2', stepNumber: 2,
        title: 'Extract given values',
        explanation: 'Initial velocity v₀ = 15 m/s, launch angle θ = 30°, gravitational acceleration g = 9.8 m/s².',
        equation: 'v_0 = 15\\ \\text{m/s},\\quad \\theta = 30°,\\quad g = 9.8\\ \\text{m/s}^2',
      },
      {
        id: 's3', stepNumber: 3,
        title: 'Compute sin²(30°)',
        explanation: 'sin(30°) = 0.5, so sin²(30°) = 0.25. This is the trigonometric value we need.',
        equation: '\\sin(30°) = 0.5 \\implies \\sin^2(30°) = 0.25',
      },
      {
        id: 's4', stepNumber: 4,
        title: 'Substitute and simplify',
        explanation: 'Plug the known values into the formula and evaluate numerically.',
        equation: 'H = \\frac{(15)^2 \\times 0.25}{2 \\times 9.8} = \\frac{56.25}{19.6}',
        isKeyStep: true,
      },
      {
        id: 's5', stepNumber: 5,
        title: 'Final answer',
        explanation: 'Python sandbox confirms H ≈ 2.87 m. The ball reaches a maximum height of 2.87 metres.',
        equation: 'H \\approx 2.87\\ \\text{m}\\ \\checkmark',
        isKeyStep: true,
      },
    ],
    finalAnswer: 'H ≈ 2.87 m',
    mistakeAnalysis: {
      divergenceStep: 3,
      studentWork: 'H = 15² × 0.5 / 19.6 ≈ 5.74 m',
      correctWork: 'H = 15² × 0.25 / 19.6 ≈ 2.87 m',
      mistakeLabel: 'Forgot to square sin(θ)',
      errorClass: 'conceptual',
      explanation: 'You used sin(30°) = 0.5 directly instead of sin²(30°) = 0.25. The formula requires the sine to be squared.',
      conceptualNote: 'The sin² comes from squaring the vertical velocity component v_y = v₀sinθ in the kinematic identity v_y² = 2gH.',
    },
    chatResponses: {
      sin: "sin(30°) equals exactly 0.5 — it's one of the standard exact values: sin(30°) = 1/2, so sin²(30°) = 1/4 = 0.25.",
      square: "The formula comes from setting v_y = 0 at max height in v_y² = v_{y0}² - 2gH. Solving gives H = v_{y0}²/2g = (v₀sinθ)²/2g, hence the sin².",
      energy: "Yes — you can also use energy conservation: ½mv_y² = mgH at max height gives H = v_y²/2g = (v₀sinθ)²/2g. Same result.",
    },
  },

  // 1 — Calculus: definite integral  (standard → Haiku)
  {
    subject: 'math',
    concepts: ['integration', 'power-rule', 'fundamental-theorem'],
    difficulty: 'standard',
    steps: [
      {
        id: 'c1', stepNumber: 1,
        title: 'Set up the integral',
        explanation: 'We need to evaluate the definite integral of x² from 0 to 3. The antiderivative of xⁿ is xⁿ⁺¹/(n+1).',
        equation: '\\int_0^3 x^2\\, dx',
        isKeyStep: true,
      },
      {
        id: 'c2', stepNumber: 2,
        title: 'Find the antiderivative',
        explanation: 'Apply the power rule for integration: ∫xⁿdx = xⁿ⁺¹/(n+1) + C. For n=2, the antiderivative is x³/3.',
        equation: '\\int x^2\\, dx = \\frac{x^3}{3} + C',
      },
      {
        id: 'c3', stepNumber: 3,
        title: 'Apply the Fundamental Theorem',
        explanation: 'Evaluate the antiderivative at the upper bound (3) minus the lower bound (0).',
        equation: '\\left[\\frac{x^3}{3}\\right]_0^3 = \\frac{3^3}{3} - \\frac{0^3}{3}',
        isKeyStep: true,
      },
      {
        id: 'c4', stepNumber: 4,
        title: 'Final answer',
        explanation: '3³/3 = 27/3 = 9. The area under x² from 0 to 3 is exactly 9 square units.',
        equation: '= \\frac{27}{3} - 0 = 9',
        isKeyStep: true,
      },
    ],
    finalAnswer: '9',
    mistakeAnalysis: {
      divergenceStep: 2,
      studentWork: '∫x² dx = x³ + C → [x³]₀³ = 27',
      correctWork: '∫x² dx = x³/3 + C → [x³/3]₀³ = 9',
      mistakeLabel: 'Forgot to divide by the new exponent',
      errorClass: 'conceptual',
      explanation: 'You raised the power correctly (x² → x³) but forgot the /3 that the power rule requires. The antiderivative of x² is x³/3, not x³.',
      conceptualNote: 'The power rule states ∫xⁿdx = xⁿ⁺¹/(n+1). Both the increment AND the division by (n+1) are required — they undo each other when you differentiate back.',
    },
    chatResponses: {
      power: "The power rule ∫xⁿdx = xⁿ⁺¹/(n+1) comes from reversing differentiation. d/dx(xⁿ⁺¹/(n+1)) = (n+1)xⁿ/(n+1) = xⁿ. So dividing by (n+1) ensures the derivative gives back xⁿ.",
      theorem: "The Fundamental Theorem says ∫ₐᵇ f(x)dx = F(b) - F(a) where F is any antiderivative. The constant C cancels: [F(b)+C] - [F(a)+C] = F(b) - F(a).",
      area: "Geometrically, the definite integral gives the signed area between the curve and the x-axis. For x² from 0 to 3, it's the area under a parabola — 9 square units.",
    },
  },

  // 2 — Chemistry: stoichiometry  (standard → Haiku)
  {
    subject: 'chemistry',
    concepts: ['stoichiometry', 'mole-ratio', 'molar-mass'],
    difficulty: 'standard',
    steps: [
      {
        id: 'ch1', stepNumber: 1,
        title: 'Write the balanced equation',
        explanation: 'Combustion of methane with oxygen produces carbon dioxide and water. Balance: 1 CH₄ + 2 O₂ → 1 CO₂ + 2 H₂O.',
        equation: 'CH_4 + 2\\,O_2 \\to CO_2 + 2\\,H_2O',
        isKeyStep: true,
      },
      {
        id: 'ch2', stepNumber: 2,
        title: 'Convert grams to moles',
        explanation: 'Molar mass of CH₄ = 12 + 4(1) = 16 g/mol. For 32 g of methane:',
        equation: 'n_{CH_4} = \\frac{32\\ \\text{g}}{16\\ \\text{g/mol}} = 2\\ \\text{mol}',
      },
      {
        id: 'ch3', stepNumber: 3,
        title: 'Apply stoichiometry',
        explanation: 'The mole ratio of CO₂ to CH₄ is 1:1. So 2 mol CH₄ produces 2 mol CO₂.',
        equation: '2\\ \\text{mol CH}_4 \\times \\frac{1\\ \\text{mol CO}_2}{1\\ \\text{mol CH}_4} = 2\\ \\text{mol CO}_2',
        isKeyStep: true,
      },
      {
        id: 'ch4', stepNumber: 4,
        title: 'Convert moles to grams',
        explanation: 'Molar mass of CO₂ = 12 + 2(16) = 44 g/mol.',
        equation: '2\\ \\text{mol} \\times 44\\ \\text{g/mol} = 88\\ \\text{g CO}_2',
        isKeyStep: true,
      },
    ],
    finalAnswer: '88 g CO₂',
    mistakeAnalysis: {
      divergenceStep: 3,
      studentWork: 'n(CH₄) = 2 mol → n(CO₂) = 4 mol → 4 × 44 = 176 g',
      correctWork: 'n(CH₄) = 2 mol → n(CO₂) = 2 mol → 2 × 44 = 88 g',
      mistakeLabel: 'Used the O₂ coefficient instead of CO₂ coefficient',
      errorClass: 'setup',
      explanation: 'You multiplied by 2 (the O₂ coefficient) when applying stoichiometry for CO₂. The CH₄:CO₂ ratio is 1:1, not 1:2.',
      conceptualNote: 'In stoichiometry, you must use the mole ratio for the specific pair of substances. CH₄:CO₂ = 1:1 means equal moles. CH₄:O₂ = 1:2 is a different ratio — read the coefficient for the substance you want.',
    },
    chatResponses: {
      balance: "Balancing ensures atom conservation. CH₄ has 1 C and 4 H. CO₂ has 1 C; H₂O has 2 H. So 1 CO₂ balances 1 C, and 2 H₂O balances 4 H. Then 2+1=2+1 O requires 2 O₂ on the left.",
      molar: "Molar mass is the mass of one mole of a substance in g/mol. It equals the sum of atomic masses: CH₄ = 12(C) + 4×1(H) = 16 g/mol.",
      ratio: "The stoichiometric ratio comes directly from the balanced equation's coefficients. For CH₄ + 2O₂ → CO₂ + 2H₂O: 1 mol CH₄ reacts with 2 mol O₂ to produce 1 mol CO₂ and 2 mol H₂O.",
    },
  },

  // 3 — Algebra: quadratic formula  (trivial → deterministic solver, no LLM)
  {
    subject: 'math',
    concepts: ['quadratic-formula', 'discriminant'],
    difficulty: 'trivial',
    steps: [
      {
        id: 'a1', stepNumber: 1,
        title: 'Identify a, b, c',
        explanation: 'Rearrange to standard form ax² + bx + c = 0. For 2x² - 5x + 2 = 0: a = 2, b = -5, c = 2.',
        equation: '2x^2 - 5x + 2 = 0 \\quad (a=2,\\ b=-5,\\ c=2)',
        isKeyStep: true,
      },
      {
        id: 'a2', stepNumber: 2,
        title: 'Compute the discriminant',
        explanation: 'The discriminant Δ = b² - 4ac determines how many real solutions exist. Δ > 0 means two real roots.',
        equation: '\\Delta = (-5)^2 - 4(2)(2) = 25 - 16 = 9',
      },
      {
        id: 'a3', stepNumber: 3,
        title: 'Apply the quadratic formula',
        explanation: 'Two roots: x = (-b ± √Δ) / 2a. Substituting our values:',
        equation: 'x = \\frac{-(-5) \\pm \\sqrt{9}}{2(2)} = \\frac{5 \\pm 3}{4}',
        isKeyStep: true,
      },
      {
        id: 'a4', stepNumber: 4,
        title: 'Solve both cases',
        explanation: 'Taking + and − separately gives the two roots. Verification: 2(2)² - 5(2) + 2 = 0 ✓ and 2(0.5)² - 5(0.5) + 2 = 0 ✓.',
        equation: 'x_1 = \\frac{5+3}{4} = 2,\\quad x_2 = \\frac{5-3}{4} = \\frac{1}{2}',
        isKeyStep: true,
      },
    ],
    finalAnswer: 'x = 2 or x = ½',
    mistakeAnalysis: {
      divergenceStep: 2,
      studentWork: 'Δ = (-5)² - 4(2)(2) = 25 - 8 = 17',
      correctWork: 'Δ = (-5)² - 4(2)(2) = 25 - 16 = 9',
      mistakeLabel: '4ac computed as 4×2 instead of 4×2×2',
      errorClass: 'arithmetic',
      explanation: 'You computed 4ac as 4×2 = 8 instead of 4×2×2 = 16. In 4ac all three values multiply together: 4 × a × c = 4 × 2 × 2 = 16.',
      conceptualNote: 'The discriminant formula is b² - 4·a·c — a full three-way product. A common error is treating it as b² - 4·(a+c) or 4·(a or c) only. Always expand all three.',
    },
    chatResponses: {
      discriminant: "The discriminant b²-4ac tells you the nature of the roots before you solve. Δ > 0: two real roots. Δ = 0: one repeated root. Δ < 0: no real roots (complex). It's derived from the quadratic formula's square root.",
      quadratic: "The quadratic formula x = (-b ± √(b²-4ac)) / 2a is derived by completing the square on ax²+bx+c=0. It always works for any quadratic, no factoring needed.",
      verify: "To verify x=2: 2(4) - 5(2) + 2 = 8 - 10 + 2 = 0 ✓. To verify x=½: 2(¼) - 5(½) + 2 = ½ - 2½ + 2 = 0 ✓. Both roots satisfy the original equation.",
    },
  },
];

// Subjects whose final answer can be confirmed in the Python sandbox → earn the
// "✓ Verified" badge. Everything else is clearly labelled unverified.
const VERIFIABLE: Subject[] = ['math', 'physics', 'chemistry'];

// ─── Router / evaluator ─────────────────────────────────────────────────────────
// The cost lever (PLAN.md §9.1–9.3): a cheap pre-pass decides the cheapest engine
// that can serve each request, escalating to Opus ONLY when reasoning demands it.
// Ladder:  shared cache  →  rule-based solver  →  Haiku  →  Opus.

export interface SolveOptions {
  /** Restrict which subjects may be served (free tier is math-only). */
  subjectScope?: Subject[];
}

/** Illustrative per-request cost, in cents, by engine. Opus is ~6× Haiku. */
const ENGINE_COST_CENTS: Record<SolveEngine, number> = {
  cache: 0,
  rule_based: 0,
  haiku: 0.4,
  opus: 2.6,
};

// Shared problem cache: students photograph the same textbook problems
// constantly. A hit serves a verified solution at ~$0 and never touches Opus.
const problemCache = new Map<string, MockProblem>();

function contentHash(mode: SolveMode, problemImageUri: string, workImageUri?: string): string {
  return `${mode}::${problemImageUri}::${workImageUri ?? ''}`;
}

function inScope(problem: MockProblem, scope?: Subject[]): boolean {
  return !scope || scope.includes(problem.subject);
}

function pickProblem(scope?: Subject[]): MockProblem {
  const pool = PROBLEMS.filter((p) => inScope(p, scope));
  const source = pool.length > 0 ? pool : PROBLEMS;
  return source[solveCounter++ % source.length];
}

/**
 * Decide which engine handles a request. This is the "router/evaluator" — it
 * runs before any expensive model call so Opus is reserved for work that needs
 * step-level reasoning (hard solves + every Mistake Detective analysis).
 */
function decideEngine(
  mode: SolveMode,
  problem: MockProblem,
  cacheHit: boolean,
): RoutingDecision {
  const subject = problem.subject;
  const verify = VERIFIABLE.includes(subject);

  let engine: SolveEngine;
  let reason: string;

  if (cacheHit) {
    engine = 'cache';
    reason = 'Cache hit — identical problem already solved and verified. Served at ~$0.';
  } else if (mode === 'mistake_detective') {
    // Step-level divergence detection is the defensible feature — always Opus.
    engine = 'opus';
    reason = 'Mistake analysis needs step-level reasoning → Opus.';
  } else if (problem.difficulty === 'trivial') {
    engine = 'rule_based';
    reason = 'Trivial, well-structured problem → deterministic solver, no LLM.';
  } else if (problem.difficulty === 'standard') {
    engine = 'haiku';
    reason = 'Standard problem → Haiku handles it cheaply.';
  } else {
    engine = 'opus';
    reason = 'Complex multi-step reasoning → escalate to Opus.';
  }

  const estimatedCostCents = ENGINE_COST_CENTS[engine] + (verify && engine !== 'cache' ? 0.1 : 0);

  return {
    subject,
    complexity: problem.difficulty,
    engine,
    verify,
    cacheHit,
    reason,
    estimatedCostCents: Math.round(estimatedCostCents * 100) / 100,
  };
}

/** Per-engine latency, so the reasoning console reflects the real cost profile. */
function engineDelay(engine: SolveEngine, mode: SolveMode): number {
  switch (engine) {
    case 'cache':
      return 600;
    case 'rule_based':
      return 1200;
    case 'haiku':
      return 2200;
    case 'opus':
      return mode === 'mistake_detective' ? 5200 : 4200;
  }
}

function buildChatReply(problem: MockProblem, message: string): string {
  const lower = message.toLowerCase();
  // Concept keywords resolve against every problem's notes, so "Ask Solvr" can
  // answer about a concept regardless of which problem is on screen.
  for (const p of [problem, ...PROBLEMS]) {
    for (const [key, reply] of Object.entries(p.chatResponses)) {
      if (lower.includes(key)) return reply;
    }
  }
  if (lower.includes('another method') || lower.includes('different way')) {
    return "There's usually more than one valid approach in STEM. For this problem, you could also work backwards from the answer to verify, or use dimensional analysis to check units before committing to a full solution.";
  }
  if (lower.includes('study') || lower.includes('note') || lower.includes('summary')) {
    return `Key takeaway from this problem: ${problem.steps[0].explanation} The most common mistake is ${problem.mistakeAnalysis.mistakeLabel.toLowerCase()}. Review the formula and practice two more problems of the same type tonight.`;
  }
  return `Great question about this solution. The core concept here is ${problem.steps.find((s) => s.isKeyStep)?.title ?? 'the key formula'}. Would you like me to show an alternative derivation, explain a specific step in more detail, or generate a similar practice problem?`;
}

let lastProblem: MockProblem | null = null;

// ─── Offline fallback ──────────────────────────────────────────────────────────
// Used by api.ts whenever EXPO_PUBLIC_API_BASE_URL isn't set, so the app runs
// fully offline in dev. The real backend lives in backend/ (see its README) —
// api.ts calls it over HTTP with the exact same interface as this module.

/**
 * Inspect how a request would be routed without solving it. Backed by the same
 * classification the real Haiku/rule-based pre-pass performs server-side.
 * Async so the mock and real HTTP client share one interface (see api.ts).
 */
export async function route(
  mode: SolveMode,
  problemImageUri: string,
  workImageUri?: string,
  opts?: SolveOptions,
): Promise<RoutingDecision> {
  const key = contentHash(mode, problemImageUri, workImageUri);
  const cached = problemCache.get(key);
  const problem = cached ?? pickProblem(opts?.subjectScope);
  // Peeking must not consume a fresh problem from the rotation if we intend to
  // solve next; remember it so solve() reuses this exact classification.
  lastProblem = problem;
  return decideEngine(mode, problem, Boolean(cached));
}

export async function solve(
  mode: SolveMode,
  problemImageUri: string,
  workImageUri?: string,
  opts?: SolveOptions,
): Promise<SolveSession> {
  const key = contentHash(mode, problemImageUri, workImageUri);
  const cached = problemCache.get(key);
  const problem = cached ?? pickProblem(opts?.subjectScope);
  const routing = decideEngine(mode, problem, Boolean(cached));

  await MOCK_DELAY(engineDelay(routing.engine, mode));

  // Populate the shared cache so a repeat photo of the same problem is free.
  if (!cached) problemCache.set(key, problem);
  lastProblem = problem;

  return {
    id: uuid(),
    mode,
    subject: problem.subject,
    concepts: problem.concepts,
    problemImageUri,
    workImageUri,
    createdAt: new Date().toISOString(),
    steps: problem.steps,
    finalAnswer: problem.finalAnswer,
    verified: routing.verify,
    routing,
    chatHistory: [],
    savedToArchive: false,
    mistakeAnalysis: mode === 'mistake_detective' ? problem.mistakeAnalysis : undefined,
  };
}

export async function chat(sessionId: string, message: string, history: ChatMessage[]): Promise<string> {
  await MOCK_DELAY(900 + Math.random() * 400);
  const problem = lastProblem ?? PROBLEMS[0];
  return buildChatReply(problem, message);
}

/** Offline stand-in for the backend's Haiku-generated practice problems
 * (PLAN.md v1.5). Templated, not model-generated — good enough to exercise
 * the Practice screen's self-grading flow without a live backend. */
export async function practice(concept: string, subject: Subject): Promise<PracticeProblem> {
  await MOCK_DELAY(1200);
  const pretty = concept.replace(/-/g, ' ');
  return {
    id: uuid(),
    concept,
    subject,
    question: `Practice problem: apply ${pretty} to a fresh example. (This is a placeholder — connect the real backend for model-generated practice.)`,
    expectedAnswer: '42',
    hint: `Revisit how ${pretty} works before answering.`,
    explanation: `Working through ${pretty} again: identify the given quantities, apply the same rule you used in your last solve, and check the result makes sense.`,
  };
}
