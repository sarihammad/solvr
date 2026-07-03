# Solvr

**Turn confusion into clarity.**

Solvr is an AI-native academic operating system for STEM students. It goes beyond solving homework — it helps you understand exactly where your reasoning breaks down, builds a searchable archive of your work, and lets you have an interactive conversation about any step in a solution.

---

## What makes Solvr different

| Feature | Why it matters |
|---|---|
| **Python-verified solutions** | Eliminates hallucination for math/physics — students trust you |
| **Mistake Detective mode** | Compares your work against the correct answer step-by-step |
| **Interactive "Ask Solvr"** | Chat about any solution step, ask for alternative methods, get study notes |
| **Study Archive** | Searchable history with weakness detection and subject analytics |
| **5-tier monetization** | Aligned with student psychology — Exam Boost for finals week |

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Xcode (iOS) or Android Studio (Android)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/solvr.git
cd solvr

# Install dependencies
npm install

# Install new Expo packages (important — run this to resolve correct versions)
npx expo install expo-camera expo-image-picker expo-haptics expo-blur expo-linear-gradient expo-apple-authentication expo-file-system

# Copy the env template
cp .env.example .env
```

### Environment Variables

Edit `.env` with your credentials:

```env
REVENUECAT_IOS_KEY=your_revenuecat_ios_key
REVENUECAT_ANDROID_KEY=your_revenuecat_android_key
EAS_PROJECT_ID=your_eas_project_id

# Optional — point the app at the real backend (see backend/README.md).
# Leave unset to run fully offline against the local mock.
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Running

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## Backend

A real FastAPI backend lives in [`backend/`](backend/README.md) — see that README for what's actually wired up versus scaffolded for later (Postgres/Redis are provisioned in `docker-compose.yml` but not yet read/written by the app).

- **Router/evaluator** — a cheap rule-based + Haiku pre-pass classifies each request and picks the cheapest engine that can serve it, escalating to **Opus only when reasoning demands it** (every Mistake Detective analysis, complex solves): `cache → rule_based → haiku → opus`.
- **Shared problem cache** — repeat photos of the same textbook problem are served from cache at ~$0, never touching Opus.
- **Claude** — `claude-opus-4-8` for reasoning + Mistake Detective; `claude-haiku-4-5` for OCR/classification and simple solves.
- **SymPy sandbox** — verified numerical computation, isolated in a subprocess with a hard timeout (earns the ✓ badge — see the backend README's "Verification scope" note on what this does and doesn't guarantee).

### Running the app against it

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

Then set `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000` in the app's `.env` (see above). `src/lib/api.ts` calls the backend whenever that variable is set, and falls back to `src/lib/mockApi.ts` otherwise — so the app runs fully offline in dev by default.

---

## Subscription Tiers

| Plan | Price | What you get |
|---|---|---|
| Free | $0 | 3 verified solves/day, **math only**, watermarked shares |
| **Solvr Pro** | **$59.99/yr** or $11.99/mo | Unlimited solves, all STEM subjects, Mistake Detective, Weakness Graph + practice, exports |
| Exam Boost | $6.99 / 7-day pass | Everything in Pro for 7 days, priority queue — built for finals week |

Everything defensible — Mistake Detective, the Weakness Graph, exports — lives inside **Pro**. Annual is the primary offer (listed first). Exam Boost is a consumable that monetises finals-week intent and on-ramps to Pro. See [PLAN.md](PLAN.md) §7 for the rationale.

Subscriptions are managed via [RevenueCat](https://revenuecat.com). Configure your product IDs in `src/constants/tiers.ts` (each plan's `billing[]` options) and the RevenueCat dashboard.

---

## Deployment

Builds are managed with EAS Build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure the project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Tech Stack

- **React Native + Expo 56** — Cross-platform mobile
- **Redux Toolkit** — State management
- **React Navigation 7** — Navigation (stack + bottom tabs)
- **expo-camera** — Live camera viewfinder
- **expo-image-picker** — Gallery access
- **expo-haptics** — Haptic feedback on capture
- **RevenueCat** — In-app subscriptions
- **Zod + React Hook Form** — Form validation
