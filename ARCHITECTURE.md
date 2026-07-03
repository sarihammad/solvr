# Solvr — Architecture

## System Design Philosophy

Solvr is architected around three principles:

1. **Trust through verification** — Math/physics answers are verified in a Python sandbox, not guessed
2. **Learning over answers** — Mistake Detective mode exists at the same level as the solver; it's not a feature, it's half the product
3. **Simplicity over sophistication** — No LangGraph, no agent swarms. A clean routing layer: classify → OCR → verify → explain

---

## Folder Structure

```
solvr/
├── App.tsx                          # Root component, Redux + Navigation provider
├── app.config.js                    # Expo config with plugin declarations
├── src/
│   ├── types/
│   │   └── index.ts                 # All shared TypeScript types
│   ├── constants/
│   │   ├── theme.ts                 # COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS
│   │   └── tiers.ts                 # Subscription tier definitions (Free / Pro / Exam Boost)
│   ├── store/
│   │   ├── index.ts                 # configureStore + typed hooks
│   │   ├── authSlice.ts             # isAuthenticated, user — unwired from nav, kept for post-MVP
│   │   ├── onboardingSlice.ts       # hasOnboarded — actually gates RootNavigator now
│   │   ├── subscriptionSlice.ts     # tier, dailySolvesUsed, dailySolvesLimit
│   │   ├── solveSlice.ts            # current SolveSession, ProcessingStatus
│   │   └── archiveSlice.ts          # ArchiveItem[], SubjectSummary[], searchQuery
│   ├── lib/
│   │   ├── api.ts                   # Dispatcher: real HTTP client or mockApi, per EXPO_PUBLIC_API_BASE_URL
│   │   ├── mockApi.ts               # Offline mock (route/solve/chat/practice) — dev fallback
│   │   ├── weakness.ts              # buildConceptWeaknesses, computeWeeklyReport (pure, tested)
│   │   ├── answerMatch.ts           # looseAnswerMatch — client-side practice self-grading
│   │   ├── auth.ts                  # Google + Apple auth hooks
│   │   ├── revenuecat.ts            # RevenueCat setup, purchase, restore
│   │   └── imageUtils.ts            # Gallery picker (expo-image-picker)
│   ├── hooks/
│   │   ├── useSolve.ts              # Orchestrates solve flow + chat + archive
│   │   ├── useGate.ts               # Subscription gates (checkSolve, checkMistakeDetective, checkExport, checkSubject, checkPractice)
│   │   └── useWeeklyReport.ts       # useAppSelector + useMemo wrapper around computeWeeklyReport
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx           # Reusable button (primary/secondary/ghost/danger)
│   │   │   └── Card.tsx             # Surface card with optional accent border
│   │   ├── capture/
│   │   │   └── ModeToggle.tsx       # Solve / Mistake Detective toggle pill
│   │   ├── processing/
│   │   │   └── AgentConsole.tsx     # Animated terminal-style progress steps
│   │   ├── solution/
│   │   │   ├── StepCard.tsx         # Expandable step with equation + "Ask about this"
│   │   │   ├── ChatBubble.tsx       # Chat message bubble (user/assistant)
│   │   │   └── MistakeReport.tsx    # Divergence display with side-by-side comparison
│   │   ├── archive/
│   │   │   └── SolveCard.tsx        # Archive list item with thumbnail + subject tag
│   │   └── paywall/
│   │       └── PricingCard.tsx      # Tier card with feature list + CTA
│   ├── screens/
│   │   ├── auth/                    # Unwired from RootNavigator — auth disabled for MVP
│   │   │   ├── OnboardingScreen.tsx # App introduction; CTA now navigates to TrialPaywall, not Login
│   │   │   └── LoginScreen.tsx      # Email/password + Google + Apple auth — kept for post-MVP
│   │   ├── TrialPaywallScreen.tsx   # Forced trial paywall — no skip, no free tier shown, only way past onboarding
│   │   ├── CaptureScreen.tsx        # Full-screen camera with mode toggle
│   │   ├── ProcessingScreen.tsx     # Blurred photo bg + AgentConsole animation
│   │   ├── SolutionScreen.tsx       # Steps tab + Ask Solvr chat tab + action bar
│   │   ├── ArchiveScreen.tsx        # Stats, Weekly Report (top 3 weak concepts + Practice CTA), subject chips, FlatList of SolveCards
│   │   ├── PracticeScreen.tsx       # Generated practice problem, hint, self-graded answer, solution fallback
│   │   ├── ProfileScreen.tsx        # User info, subscription, usage, menu (Sign Out hidden)
│   │   └── PaywallScreen.tsx        # Contextual mid-app upsell — Pro (annual/monthly) & Exam Boost
│   └── navigation/
│       ├── RootNavigator.tsx        # Onboarding vs App split (gated on hasOnboarded, not auth), + Processing/Solution/Practice/Paywall stack
│       ├── AuthNavigator.tsx        # Onboarding → Login — unreferenced from RootNavigator, kept for post-MVP
│       └── AppNavigator.tsx         # Bottom tabs: Capture | Archive | Profile
```

---

## Navigation Architecture

**Auth is disabled for MVP** (product decision — wire it back in post-MVP). `RootNavigator` no longer reads `state.auth.isAuthenticated`; it gates on `state.onboarding.hasOnboarded` instead. `authSlice.ts`, `AuthNavigator.tsx`, and `LoginScreen.tsx` are left in the codebase, fully intact, just unreferenced from `RootNavigator` — re-enabling auth means swapping the gate condition back, not rebuilding anything.

```
RootNavigator (Stack, no headers)
├── Not onboarded yet
│   ├── OnboardingScreen                (fade animation)
│   └── TrialPaywallScreen              (forced — no back/close, Android back blocked)
│       → dispatch(completeOnboarding()) on purchase/restore success
└── Onboarded (hasOnboarded === true)
    ├── MainTabs → AppNavigator (Bottom Tab)
    │   ├── CaptureScreen          (default tab)
    │   ├── ArchiveScreen          (incl. Weekly Report → Practice CTA)
    │   └── ProfileScreen         (Sign Out hidden — see auth note above)
    ├── ProcessingScreen           (fade animation, gesture disabled)
    ├── SolutionScreen             (slide from right)
    ├── PracticeScreen             (slide from right)
    └── PaywallScreen              (modal, slide from bottom — contextual, mid-app upsell)
```

**Onboarding flow (first launch only):** OnboardingScreen's single CTA navigates to `TrialPaywallScreen`, which shows Pro's features + an annual/monthly billing toggle and a **Start Free Trial** button — there is no free-tier option and no skip on this screen (`BackHandler` blocks Android back; no header/close button). Tapping it calls `purchasePackage()` then `dispatch(completeOnboarding())`; "Restore Purchases" does the same regardless of whether an entitlement was found (a returning user with nothing to restore still needs to get past this screen once, same as everyone else — they land on the regular Free tier via `useGate()`). In `__DEV__` builds only, a small "Skip (dev only)" link also completes onboarding, so local testing doesn't require live App Store/RevenueCat products configured — it's never present in production builds. Once `hasOnboarded` is true (persisted via `storage.setHasOnboarded`), this flow never shows again.

The trial itself (duration, price, auto-renewal terms) is configured on the store subscription product (App Store Connect / Google Play Console) and surfaced through RevenueCat — `TierConfig.trialDays` (7, Pro only) only drives the on-screen copy, it doesn't create the trial.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ CaptureScreen                                                        │
│  • User selects mode: Solve Problem | Mistake Detective             │
│  • Gate check: useGate().checkSolve() / checkMistakeDetective()     │
│  • CameraView.takePictureAsync() → photo URI                        │
│  • navigate → ProcessingScreen { mode, problemImageUri, workUri? }  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│ ProcessingScreen                                                      │
│  • AgentConsole animates steps with 700ms delay per step            │
│  • useSolve().solve() calls api.solve() (mock → real FastAPI)       │
│  • On complete: navigation.replace → SolutionScreen { session }     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│ SolutionScreen                                                        │
│  • Tab "Steps": StepCard list, MistakeReport (if Mistake Detective) │
│  • Tab "Ask Solvr": ChatBubble list, TextInput → api.chat()        │
│  • Action bar: Save → archiveSlice, Export (gated), New Solve       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Redux Store Shape

```typescript
{
  auth: {
    isAuthenticated: boolean,     // unread by navigation — auth disabled for MVP, see Navigation Architecture
    user: User | null
  },
  onboarding: {
    hasOnboarded: boolean         // gates RootNavigator; set by completeOnboarding() in TrialPaywallScreen
  },
  subscription: {
    tier: SubscriptionTier,       // 'free' | 'pro' | 'exam_boost'
    isSubscribed: boolean,
    dailySolvesUsed: number,
    dailySolvesLimit: number,     // 3 for free, Infinity for paid
    lastResetDate: string         // ISO date string, resets daily
  },
  solve: {
    current: SolveSession | null, // SolveSession carries `concepts` + `routing` (RoutingDecision)
    status: ProcessingStatus,     // 'idle' | 'processing' | 'complete' | 'failed'
    error: string | null
  },
  archive: {
    items: ArchiveItem[],
    subjectSummaries: SubjectSummary[],
    conceptWeaknesses: ConceptWeakness[],  // the Weakness Graph — concepts ranked by mistakes
    searchQuery: string
  }
}
```

---

## Subscription Gate System

`useGate()` hook provides these gate checks:

```typescript
checkSolve()            → blocked if free tier AND dailySolvesUsed >= limit (3/day)
checkMistakeDetective() → blocked unless tier is 'pro' or 'exam_boost'
checkExport()           → blocked if tier is 'free'
checkSubject(subject)   → blocked if the subject isn't in the tier's plan (free = math only)
```

Each gate returns `{ allowed: boolean, trigger: PaywallTrigger | null }`. When blocked, the screen navigates to `PaywallScreen` with the trigger (`daily_limit` | `mistake_detective` | `export` | `locked_subject` | `practice` | `pro_feature`), which changes the headline and the recommended plan.

---

## Weakness Graph → Practice loop (v1.5 retention pillar)

`src/lib/weakness.ts` holds two pure, independently-tested functions:

- `buildConceptWeaknesses(items)` — all-time concept ranking, cached in `archiveSlice.conceptWeaknesses` on every archive mutation.
- `computeWeeklyReport(items, now?)` — filters to the last 7 days and returns the top 3 concepts with at least one mistake. Wrapped by `useWeeklyReport()` (a thin `useAppSelector` + `useMemo`) for use in components.

`ArchiveScreen` renders the weekly report with a **Practice** button per concept, gated by `useGate().checkPractice()` (Pro/Exam Boost only — practice generation lives alongside Mistake Detective and analytics, not as a separate SKU). Tapping it navigates to `PracticeScreen({ concept, subject })`, which:

1. Calls `api.practice(concept, subject)` → backend `POST /practice` (routed to **Haiku** — generation isn't the verification-critical path, so it doesn't need Opus).
2. Self-grades the student's typed answer client-side via `src/lib/answerMatch.ts` (`looseAnswerMatch` — tolerant of formatting and rounding, e.g. "4" matches "x = 4", "2.87" matches "2.8699"). Nothing is sent back to the backend; grading never depends on network.
3. Always offers "Show Solution" as a fallback, and "Next Problem" to keep drilling the same concept.

Practice problems are **not persisted** — each call is stateless. If a durable practice history is wanted later, it plugs into the same PostgreSQL layer PLAN.md §9.4 describes for solves.

---

## Router / Evaluator (cost control)

`src/lib/api.ts` runs a **router/evaluator** before any expensive model call. A cheap
rule-based + Haiku pre-pass classifies each request and picks the cheapest engine that
can serve it, escalating to Opus **only when reasoning demands it**:

```
shared cache  →  rule_based  →  haiku  →  opus
```

- `api.route(mode, problemUri, workUri?, opts?)` returns a `RoutingDecision`
  (`subject`, `complexity`, `engine`, `verify`, `cacheHit`, `reason`, `estimatedCostCents`)
  without solving — the same classification the real backend does server-side.
- `api.solve(...)` composes route → solve, attaches `routing` to the returned session, and
  populates a **shared problem cache** so a repeat photo of the same problem is served at ~$0.
- **Mistake Detective always routes to Opus** (step-level divergence detection is the moat);
  trivial problems use a deterministic solver (no LLM); standard problems use Haiku.
- Free tier passes `subjectScope: ['math']` so the router never serves an out-of-plan subject.

The chosen engine is surfaced in the UI (`SolutionScreen` engine chip) and drives the
reasoning-console latency, so the cost profile is visible and testable
(`__tests__/lib/router.test.ts`).

## Mock API ↔ Real Backend

`src/lib/api.ts` is a **dispatcher**, not the mock itself. The mock lives in `src/lib/mockApi.ts`
(`route()`, `solve()`, `chat()` as bare async exports); `api.ts` picks the real HTTP client or the
mock per-function based on whether `EXPO_PUBLIC_API_BASE_URL` is set:

```typescript
export const api = {
  route: API_BASE ? realRoute : mock.route,
  solve: API_BASE ? realSolve : mock.solve,
  chat: API_BASE ? realChat : mock.chat,
};
```

The real backend lives in [`backend/`](../backend/README.md) (FastAPI). Request/response bodies
are camelCase JSON with **base64 image data**, not multipart form data — `SolveRequest` takes
`problemImageBase64`/`workImageBase64` directly, matching the shape Claude's vision API wants.
The client converts a local file URI to base64 via `expo-file-system`'s `File` class
(`new File(uri).base64()`) before sending.

The backend never sees the client's local file URI — only image bytes — so `realSolve()` merges
`problemImageUri`/`workImageUri` back into the response client-side after the HTTP call returns.

**Server-enforced plan gating:** the backend independently checks `subjectScope` against the
classified subject and returns `403 { detail: { error: "locked_subject" } }` if a free-tier request
resolves to an out-of-plan subject — this is not just a client-side `useGate()` check. The client
translates that into a `LockedSubjectError` (`src/lib/api.ts`), which `useSolve()` rethrows past its
usual catch-and-return-null handling so `ProcessingScreen` can route to `PaywallScreen` with
`trigger: 'locked_subject'` instead of just failing silently.

---

## Design System

Light theme. All visual constants are in `src/constants/theme.ts`:

- **Background**: `#FFFFFF`
- **Surface**: `#F4F8FB`
- **Accent**: `#0284C7` (sky blue — primary brand, CTAs, focus states, tab bar active state)
- **Success/Verified**: `#0D9488` (mint — verified answer badge, positive states)
- **Warning**: `#D97706` (mistake detection)
- **Error**: `#DC2626` (gate blocking, error states)
- **Subject tag colors** (`src/constants/subjectColors.ts`, shared by `ArchiveScreen` and `SolveCard` — previously duplicated in both, now one source of truth): math/chemistry echo the two brand accents; physics/biology/economics/cs/other are picked to stay visually distinct from those and from each other.
- **Typography**: Inter 400 throughout, size scale xs(11) → 3xl(36)
- **No NativeWind** in screens — StyleSheet only for consistency and perf

**Camera/processing screens intentionally opt out of the light theme.** `CaptureScreen`, `ModeToggle`, `ProcessingScreen`, and `AgentConsole` render over a live camera feed or a blurred-photo scrim and hardcode light-text-on-dark styling regardless of `COLORS.text`/`textSecondary` (which are dark in the light theme) — each has an inline comment marking this. This is deliberate, not a missed spot in the palette sweep.

**Known follow-up (not code):** `assets/splash.png`/`icon.png` are raster images from the original dark theme and weren't regenerated as part of this change — an image-editing pass, not something fixable in source. `app.config.js`'s `splash.backgroundColor` and `userInterfaceStyle` were updated to `'#FFFFFF'`/`'light'`, but the artwork itself may still assume a dark backdrop.

---

## Backend Architecture

A real backend now lives in [`backend/`](backend/README.md), superseding the earlier target-only sketch. Actual flow:

```
[ React Native App ]
        │ HTTPS (camelCase JSON, base64 images)
        ▼
[ FastAPI — app/main.py ]
        │
[ OCR + classify — Haiku vision, one call ]
        │
[ decide_engine() — app/router.py ]
        │
   ┌─────────────┬─────────────┬─────────────┐
   ▼ cache hit    ▼ trivial     ▼ standard    ▼ complex / mistake_detective
[ SQLite cache] [ rule_solver  [ Haiku solve ] [ Opus solve /
  ~$0          ]  no LLM ]                      analyze_mistake,
                                                 adaptive thinking ]
        │
[ verify_numeric() — SymPy subprocess sandbox, verifiable subjects only ]
        │
        ▼
[ SolveResponse → client merges local image URI back in ]
```

See `backend/README.md` for exactly what's wired up versus scaffolded for later (Postgres/Redis are provisioned in `docker-compose.yml` but not yet read/written by the app).
