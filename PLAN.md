# Solvr — Product Vision, Design & Architecture

*Author's note: This is the master plan. It builds on the existing scaffold in `src/` and the prior `ARCHITECTURE.md`/`README.md`, but it makes deliberate, opinionated changes where I believe they increase the odds of building a profitable product rather than a beautiful demo. Sections marked **⚠ Decision** are places where I've overruled or refined the original plan — those are the things I want you to explicitly approve before we build.*

---

## 1. The one-paragraph bet

The "snap a photo → get worked solution" product is **already free and commoditized** — GPT‑style vision assistants, Photomath (Google), and Gauth (ByteDance) all do it at zero cost. A paid standalone solver has almost no moat and terrible unit economics, because the users who want *answers* will never pay when a free chatbot exists. **Solvr's bet is to sell understanding, not answers, to the students who are already failing and know it.** The wedge is a feature no general chatbot does well: take *your* wrong work plus the correct answer and pinpoint the exact step where your reasoning broke and why. Around that wedge we build trust (Python‑verified math/physics), retention (a personal archive that learns your weaknesses and generates targeted practice), and a growth loop (beautiful, shareable, watermarked solutions). That combination — defensible feature + trust + retention + virality — is what turns a $0.30-per-solve cost center into a subscription business.

---

## 2. Market reality (why the original vision needed sharpening)

| Competitor | What they do | Why we don't fight them head-on |
|---|---|---|
| ChatGPT / Gemini (vision) | Solve almost anything from a photo, free | We lose a "solve it" war. We win a "why am I wrong" war. |
| Photomath (Google) | Best-in-class math OCR + steps, free | Owned by Google, free forever. We don't out-solve; we out-*teach* and out-*retain*. |
| Gauth, Question.AI, Answer.AI | AI homework, freemium, huge install base | Race to the bottom on price and breadth. We go narrow and premium. |

**The strategic consequence:** breadth is a trap and low price is a trap. We launch **narrow (STEM only), premium, and learning-framed.** Every feature must answer one question: *does this help a student understand, or just get an answer?* The former is what people pay for and what keeps us in the App Store (see §11). The latter is a free chatbot's job.

---

## 3. Product vision

**Solvr is the verified reasoning workspace for STEM students — the fastest way to understand exactly where your thinking breaks down, and to stop making the same mistake twice.**

- **North-star metric:** *Weekly Understood Problems* — a solve where the student engaged past the answer (expanded ≥2 steps, asked a follow-up, ran a mistake analysis, or completed a generated practice problem). This is the leading indicator of retention and willingness to pay; raw solve count is a vanity metric that correlates with churn.
- **Positioning line:** "Turn confusion into clarity." Never "get your homework done."
- **Launch scope:** Math, Physics, Chemistry only. English/History/generic essays are explicitly out — they're low-trust, un-verifiable, and dilute the brand.

---

## 4. Who it's for

**Primary persona — "Struggling Sophomore Sana."** 15–20, in a required STEM course she finds hard, has access to free ChatGPT but doesn't trust it and doesn't learn from it. She has a test Friday and keeps losing points on the *same kind* of problem. She'll pay for something that tells her *why* and drills her on it — especially the week before an exam.

**Secondary — "Conscientious Parent."** Pays for the annual plan for their teen. Cares that it's a *tutor*, not a cheating tool. This persona is why the learning framing is a revenue driver, not just PR.

**Job to be done:** "When I get a problem wrong, help me understand my specific mistake and make sure I don't repeat it — fast enough to matter before the test."

---

## 5. The moat: four differentiators, ranked

1. **Mistake Detective (the wedge).** Upload your work + the correct answer → Solvr aligns your steps against a verified solution, finds the first point of divergence, classifies the error (conceptual / arithmetic / sign / setup / units), and explains the underlying misconception. *No general chatbot reliably does step-level divergence detection on messy handwritten work.* This is the headline feature and the reason to install.
2. **Verified answers (the trust layer).** For math/physics, the final answer and key steps are checked by executing code (SymPy/NumPy) in a sandbox, not just generated. A "✓ Verified" badge is the single most conversion-relevant piece of UI we have — it's the thing free chatbots can't credibly show.
3. **The Weakness Graph → Practice loop (the retention engine).** Every solve and every detected mistake is tagged by concept. Over time this builds a per-student map of weak concepts, which drives (a) a weekly "here's what you keep getting wrong" report and (b) auto-generated practice problems targeting those weaknesses. **This is what justifies a subscription over a one-time purchase** — it's an ongoing tutor, not a vending machine.
4. **The Archive (the habit + growth surface).** A searchable, beautiful history of everything you've solved, by subject, with analytics. It's the reason to open the app when you *don't* have a problem, and the surface that produces shareable artifacts.

> ⚠ **Decision — promote the Weakness→Practice loop to a first-class pillar.** The original plan treated practice/analytics as a top-tier upsell ("Tutor Plus"). I'm elevating it to *the* retention mechanic and folding it into the main subscription. Analytics that only exist behind the most expensive tier can't build the habit that drives renewals. More on pricing in §7.

---

## 6. Feature set & core journeys

### The spine (every solve flows through this)
**Capture → Verify → Understand → Retain → Practice**

```
 Capture            Process              Solution                 Retain            Practice
 ┌────────┐        ┌──────────┐        ┌──────────────┐        ┌──────────┐      ┌──────────┐
 │ photo/ │  ───▶  │ classify │  ───▶  │ verified     │  ───▶  │ saved to │ ───▶ │ generated│
 │ mode   │        │ OCR      │        │ steps +      │        │ archive, │      │ practice │
 │ select │        │ solve    │        │ ✓ badge      │        │ tagged   │      │ on weak  │
 └────────┘        │ verify   │        │ Ask Solvr    │        │ by concept│      │ concepts │
                   └──────────┘        │ Mistake rpt  │        └──────────┘      └──────────┘
```

### MVP (v1) — the smallest thing that proves the bet
- **Capture:** camera + gallery import, with a **Solve / Mistake Detective** mode toggle.
- **Solve mode:** verified step-by-step solution with expandable steps and a "✓ Verified" badge for math/physics.
- **Mistake Detective mode:** capture *problem + your work + correct answer* → divergence report with side-by-side comparison and error classification.
- **Ask Solvr:** chat scoped to the current solution ("explain step 3", "why isn't it X?", "show another method").
- **Archive:** history list, subject tags, search.
- **Auth + Paywall + subscriptions** (Apple/Google sign-in, RevenueCat).

### v1.5 — the retention engine
- Concept tagging on every solve → **Weakness Graph**.
- **Weekly report:** "Your 3 shakiest concepts this week" (also a re-engagement push notification).
- **Generated practice** targeting weak concepts, with self-grading.
- **Export** (PDF/Markdown) of solutions and study sheets.

### v2 — growth & depth
- **Exam Mode:** upload a syllabus/past paper → generate a practice set + a study plan for the days before the test.
- **Referral loop** and class/study-group sharing.
- **Streaks** and lightweight gamification tied to *understood problems*, not just opens.

> ⚠ **Decision — cut generic subject breadth from the roadmap entirely for now.** Expanding to English/History is where similar apps go to die (un-verifiable, low trust, App-Store-risky). We stay STEM until the STEM loop is provably retaining and monetizing.

---

## 7. Monetization

### The economic reality we're designing around
Vision + reasoning calls cost real money (see §9 for model choices). Free users must be *tightly* capped and cheaply served, or the free tier bankrupts us. Paid tiers must be simple enough to convert.

### ⚠ Decision — collapse 5 tiers into 3 + annual
The original plan had **five** tiers (Free, Premium $14.99, Mistake Detective $9.99, Exam Boost $4.99/wk, Tutor Plus $24.99). I recommend against it for three concrete reasons:

1. **Five tiers kills conversion.** Choice overload on a paywall is a well-documented conversion killer. Students decide in seconds.
2. **A separate cheaper "Mistake Detective" tier cannibalizes the flagship.** Our best, most defensible feature must be the *reason to buy Pro*, not a $9.99 side-SKU that undercuts the $14.99 plan.
3. **Splitting analytics into "Tutor Plus" starves the retention loop.** The weakness graph needs to be in the hands of *paying-but-not-whale* users to drive renewals.

**Recommended structure:**

| Plan | Price | What's in it | Purpose |
|---|---|---|---|
| **Free** | $0 | 3 solves/day, **math only**, verified badge, no Mistake Detective, no export, shared solutions watermarked | Acquisition + virality engine. 3/day (not 1) so users actually get hooked and hit the share loop. |
| **Solvr Pro** | **$11.99/mo** or **$59.99/yr** | Unlimited solves, all subjects, **Mistake Detective**, Ask Solvr, Weakness Graph + practice, export | The one subscription. Everything that matters. **Annual is the real revenue** — push it hard. |
| **Exam Boost** | **$6.99 / 7-day pass** (consumable) | Everything in Pro for 7 days, priority queue | Finals-week psychology. Converts the "I just need to survive Friday" user who won't commit to a subscription — and is a proven on-ramp to Pro. |

Rationale for the money math: the annual plan (`$59.99` ≈ `$5/mo`) is where LTV lives; the monthly plan exists mostly as an anchor that makes annual look cheap. Exam Boost monetizes intent spikes and seeds subscription conversion. Everything defensible (Mistake Detective, verification, practice) sits inside Pro so there's exactly one thing to buy.

### Contextual paywalls
The paywall headline and recommended plan change based on *why* the user hit it (`trigger`): daily limit → "Unlimited solves"; Mistake Detective tap → "See exactly where you went wrong"; export tap → "Save & share your study sheets"; near a detected exam date → surface **Exam Boost** first. This is already the right instinct in the existing scaffold (`PaywallScreen` takes a `trigger`) — we keep it and wire it to the new 3-plan model.

### Growth loops (the actual profit lever)
- **Share loop:** every solution renders to a clean, branded, watermarked image/PDF. A friend who sees it installs to remove the watermark → free tier → paywall.
- **Referral:** give a free week of Pro for each friend who installs and solves once.
- **Weekly report as retention hook:** the "here's what you keep getting wrong" push is a reason to reopen — and reopening is where conversion happens.

### ⚠ Implemented — MVP entry flow: forced trial, no auth
For MVP, first launch is **Onboarding → forced Pro trial paywall (7-day, no skip, no free tier shown) → app**. Declining isn't an option on that screen — the only ways past it are starting the trial or restoring a purchase; a lapsed/non-converted trial simply falls back to the Free tier afterward via the existing gate logic, so the tier model in §7 is unchanged, only *when* Free first becomes visible. Auth (login/signup) is disabled entirely for MVP — every user is anonymous, tracked only by RevenueCat's device-level ID — and is planned to be reintroduced post-MVP once retention/monetization are validated (the code is left in place, just unwired; see `ARCHITECTURE.md` → Navigation Architecture). This trades a cleaner acquisition funnel (fewer screens before value/payment) for no cross-device sync or account recovery until auth returns.

---

## 8. Design system & UX

**Light theme** (switched from the original dark-first identity — see `src/constants/theme.ts`): clean white surface, sky blue as the primary brand/CTA accent, mint green for verified/success states.

- **Background** `#FFFFFF` · **Surface** `#F4F8FB` · **Accent** `#0284C7` sky blue (CTAs, focus, primary brand)
- **Success/Verified** `#0D9488` mint (verified badge, positive states) · **Warning** `#D97706` (mistake detected) · **Error** `#DC2626` (gates/errors)
- Camera- and processing-context screens (`CaptureScreen`, `ProcessingScreen`, `AgentConsole`, `ModeToggle`) intentionally stay dark/light-text-on-black regardless of app theme — they sit on a live camera feed or a blurred photo scrim, where a dark backdrop is the right call independent of the app's overall theme.
- Type: Inter throughout. `StyleSheet`-based theming via `src/constants/theme.ts` (NativeWind stays out of screens — consistent with current code).

**Interaction principles:**
1. **Latency is the enemy; make waiting feel like work.** A verified solve is a multi-second pipeline. The `ProcessingScreen` "agent console" animation is good UX cover — we'll upgrade it to *stream real steps* as they're produced (see §9) so progress is honest, not theatrical.
2. **The verified badge is sacred.** It's the trust primitive. Only show it when the sandbox actually confirmed the result. Never fake it.
3. **Every solution ends in a next action**, not a dead end: Save · Ask · Practice this concept · Share.
4. **Mistake reports lead with empathy, not judgment** — "Here's the exact step to fix," framed as coaching.

Key screens (already scaffolded, refined per above): Onboarding, Login, Capture, Processing, Solution (Steps · Ask · Mistake report), Archive (stats + weakness chips + history), Profile, Paywall.

---

## 9. Technical architecture

### 9.1 Client (mobile) — keep the current stack
Expo SDK 56 / React Native, TypeScript, Redux Toolkit, React Navigation, RevenueCat (`react-native-purchases`), Apple/Google auth. This is already scaffolded and is the correct choice for a mobile-first student product. **All backend access stays behind `src/lib/api.ts`** so the mock→real swap is a one-file change (as the current architecture intends). *Per `AGENTS.md`, we read the exact Expo v56 docs before writing any native/config code.*

### 9.2 Backend — FastAPI, because verification lives in Python
```
                    ┌──────────────────────────────────────────────┐
   Mobile app ────▶ │ FastAPI gateway (auth, rate-limit, gating)    │
   (api.ts)         └───────────────┬──────────────────────────────┘
                                    │  enqueue solve job
                    ┌───────────────▼──────────────────────────────┐
                    │ Solve pipeline (async worker)                 │
                    │  1. classify   subject + problem type         │
                    │  2. OCR        problem & handwritten work     │
                    │  3. solve      reasoning + steps  (Claude)    │
                    │  4. verify     execute in sandbox (SymPy)     │
                    │  5. explain    student-facing steps (Claude)  │
                    │  (Mistake mode: align work vs verified soln)  │
                    └───────┬───────────────┬──────────────────────┘
                            │               │
                ┌───────────▼──┐   ┌────────▼─────────┐
                │ Postgres     │   │ Sandbox worker   │
                │ users, solves│   │ SymPy/NumPy in   │
                │ weakness graph│  │ gVisor/Firecracker│
                └──────────────┘   └──────────────────┘
   Redis (queue + problem cache) · Object storage (R2/S3, images)
```

- **LLM: Claude, via the Anthropic SDK.** Two-model routing for cost/quality:
  - **Reasoning + Mistake Detective + step explanation → `claude-opus-4-8`** (adaptive thinking; this is where correctness and the defensible feature live — worth the spend).
  - **Classification / cheap OCR pre-pass / short chat replies → `claude-haiku-4-5`** (fast, `$1/$5` per 1M tokens).
  - Claude has native vision, so many printed problems can be read directly from the image without a separate OCR vendor.
  - Reference pricing (per 1M tokens, for the cost model): Opus 4.8 `$5 / $25`, Sonnet 5 `$3 / $15` (intro `$2 / $10` through 2026‑08‑31), Haiku 4.5 `$1 / $5`.
- **OCR:** use Claude vision first; add **Mathpix** only for hard handwritten-math cases where accuracy justifies its per-call cost. Don't pay Mathpix on every request by default.
- **Verification sandbox:** SymPy/NumPy in an isolated worker (gVisor or Firecracker; Docker as the day-one stand-in). Only STEM problems with a checkable form get the ✓ badge; everything else is clearly labeled "unverified."
- **Streaming:** stream pipeline stages (and, where useful, step tokens) to the client over SSE/WebSocket so `ProcessingScreen` shows *real* progress and perceived latency drops.

### 9.3 The margin lever: a shared problem cache
Students photograph the *same textbook problems* constantly. Normalize each solved problem (subject + canonicalized statement) into a content hash and cache the verified solution in Redis/Postgres. A cache hit on a popular problem costs ≈ $0 instead of a full Opus + sandbox run. **At any real scale this is the difference between healthy and negative gross margin** — it's worth building early, not as an afterthought. (Mistake Detective is inherently per-student and won't cache, which is fine — it's the premium path.)

### 9.4 Data model (core tables)
`users`, `subscriptions` (tier, period, RevenueCat entitlement), `solves` (mode, subject, image refs, verified bool, steps JSON), `mistake_reports` (divergence step, error class, misconception), `concepts` + `solve_concepts` (the weakness graph edges), `practice_items`. Images in object storage; everything else in Postgres.

### 9.5 State (client) — keep the current slices
`auth`, `subscription` (tier, daily usage, reset date), `solve` (current session + status), `archive` (items, subject summaries). Add `weakness`/`practice` slices at v1.5. Gating stays in `useGate()` with `checkSolve`/`checkMistakeDetective`/`checkExport`, repointed at the 3-plan model.

---

## 10. Build roadmap

| Phase | Goal | Ships |
|---|---|---|
| **P0 — Foundation** (exists) | App shell runs on mock API | Navigation, screens, theme, store, mock `api.ts` — *already scaffolded* |
| **P1 — MVP / prove the wedge** | Verified solve + Mistake Detective, live backend, payments | FastAPI + Claude + SymPy sandbox; Capture/Process/Solution/Archive real; RevenueCat live with 3-plan model; problem cache v1 |
| **P2 — Retention engine** | Turn solves into a habit | Concept tagging → Weakness Graph; weekly report + push; generated practice; export |
| **P3 — Growth** | Lower CAC, raise LTV | Share/referral loops; Exam Mode; streaks; onboarding & paywall A/B tests |

Definition of "P1 is working": a student can photograph their wrong homework + the answer, get a correct, verified divergence report in one flow, and hit a paywall that converts — end to end on real infrastructure.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **App Store "cheating" rejection/removal** (Apple actively removes homework-cheating apps) | Learning framing is *survival*, not marketing: lead every surface with understanding/tutoring, ship Mistake Detective and practice prominently, avoid "get answers" language. This is a hard product constraint. |
| **AI cost > revenue on free tier** | Tight free cap (3/day, math only), Haiku for cheap paths, and the shared problem cache. Model the cost-per-solve *before* launch pricing is locked. |
| **Hallucinated math destroys trust** | The verification sandbox + honest "unverified" labeling. Never show ✓ without a real check. |
| **Commoditization by free chatbots** | Don't compete on solving. Compete on the wedge + retention loop, which chatbots structurally don't build. |
| **Verification only covers some problem types** | Ship verification where it's real (algebra, calculus, mechanics), label the rest clearly, expand coverage over time. Under-promise the badge. |

---

## 12. Success metrics

- **Activation:** % of new users who complete a first *Mistake Detective* solve (not just a solve) in session 1.
- **North star:** Weekly Understood Problems / active user.
- **Retention:** D1 / D7 / D30; weekly-report push open rate.
- **Monetization:** free→Pro conversion, **annual mix %**, Exam Boost → Pro upgrade rate, gross margin per solve (must be positive after cache).
- **Virality:** shared-solution installs per active user (K-factor input).

---

## 13. Decisions I need you to approve

1. **Narrow to STEM (Math/Physics/Chem), premium, learning-framed** — no generic subject breadth on the roadmap.
2. **Collapse 5 tiers → Free / Pro ($11.99·mo / $59.99·yr) / Exam Boost ($6.99·7-day)** — Mistake Detective and analytics live *inside* Pro, not as separate cheaper SKUs.
3. **Free tier = 3 solves/day, math only, watermarked shares** (up from the original 1/day) to power activation and the share loop.
4. **Promote the Weakness Graph → Practice loop to a core pillar** (v1.5), not a top-tier upsell.
5. **Build the shared problem cache early** as a first-class margin lever.
6. **Backend = FastAPI + Claude (Opus 4.8 reasoning / Haiku 4.5 cheap paths) + SymPy sandbox**, Claude-vision-first OCR with Mathpix only for hard handwriting.

If you're happy with these six, say the word and we start on **P1** — standing up the real backend behind `src/lib/api.ts` and wiring the first end-to-end verified solve.
```
