# AgroAdvisor – AI Assistant Instructions

These instructions apply to **every** request in this repository. Read them before generating or changing code.

## 1. Project Overview

**AgroAdvisor** is an AI-powered farm advisory platform for smallholder farmers, built as a final-year software engineering project. It must look and behave like a **professional, production-ready** product.

The project is built iteratively from the founder's prompts. Implement the module or behavior requested, preserve established decisions, and expect to refine the product as requirements become clearer.

### Users
- **Farmers only.** There are no buyer, admin, or other roles. Do not add role systems, admin panels, or role checks.

### Purpose
The system **interprets** weather data together with each farmer's farm profile (location, crops, livestock) to produce:
- Personalised, actionable farming advice
- Severe-weather alerts

It must **not** simply display weather. Any weather shown in the UI should support an interpretation, recommendation, or alert.

## 2. Architecture

```
AgroAdvisor/
├── client/                  # React + TypeScript + Vite + Tailwind; Cloudflare Pages
├── worker/                  # Hono + TypeScript Cloudflare Worker API and cron
├── scripts/                 # Local Firebase seeding scripts only
├── config/knowledge-base/   # Agronomic thresholds and rules
└── .github/copilot-instructions.md
```

### client/
- React + strict TypeScript + Vite + Tailwind CSS
- React Router for navigation
- Chart.js through `react-chartjs-2` for charts
- `react-leaflet` with OpenStreetMap tiles for maps
- `jsPDF` with `jspdf-autotable` for PDF reports
- Deployed to **Cloudflare Pages**

### Firebase (free Spark plan)
- **Firebase Authentication** – email/password plus Google and Microsoft sign-in through Firebase's modular SDK. Configure each OAuth provider in the Firebase console; never add provider secrets to client code.
- **Cloud Firestore** – accessed from the client using the **modular v9+ SDK** (`import { getDoc } from 'firebase/firestore'`), never the compat/namespaced API
- **Firebase Cloud Messaging** – web push notifications
- **Firestore Security Rules** enforce all permissions (each farmer can only read/write their own data). Never rely on client-side checks alone.
- Stay within Spark plan limits: **no Cloud Functions**, no paid-only features.

### worker/
Cloudflare Worker using **Hono + TypeScript**, managed with **Wrangler**. Responsibilities:
- **Weather service** – Open-Meteo (free, no API key)
- **AI risk detection engine** – evaluates forecast data against farm profiles and knowledge-base rules
- **Advisory engine** – produces personalised, actionable recommendations
- **Scheduled Cron Trigger** – background alert checks and push notifications via FCM

Authentication and data access:
- **User requests:** verify the Firebase ID token (from `Authorization: Bearer <token>`) with **`jose`** against Google's public keys, then call the **Firestore REST API using the user's own ID token** so Security Rules still apply.
- **Cron jobs:** obtain an OAuth access token from a **service account** (signed JWT via `jose`) and use it for the Firestore REST API and FCM HTTP v1 API.
- Do not use `firebase-admin` in the Worker.

### scripts/
- Local Node scripts using `firebase-admin`, **for seeding data only**. Never import these from client or worker code.

## 3. Coding Standards

### TypeScript
- `strict` mode everywhere. **No `any`** — use proper types, generics, or `unknown` with narrowing.
- Typed data models live in **`client/src/types`**. The worker defines its own types in `worker/src/types` (mirror shapes where shared).

### Data access
- **All Firestore access in the client goes through `client/src/services/*`.** Components and hooks must never import Firestore functions directly.
- Calls to the Worker API also go through a service module (e.g. `client/src/services/api.ts`).

### Worker API
- All routes are mounted under **`/api`**.
- Every response uses a consistent JSON shape:
  ```ts
  { success: boolean; data: T | null; message: string }
  ```
- Use a shared response helper so the shape is never hand-built inconsistently. Return appropriate HTTP status codes alongside it.

### Knowledge base
- All thresholds and agronomic rules (e.g. frost temperature, heat stress limits, rainfall/flood thresholds, wind limits, crop- and livestock-specific rules) live in **`config/knowledge-base` files** — never hard-coded inside engines or components.
- Each rule must have a **comment explaining what it means and why** (the agronomic reasoning and, where possible, its source).

### Secrets and configuration
- Secrets only in `.env` files (client) or **Wrangler secrets** (worker). Never commit secrets.
- Always provide and keep up to date **`.env.example`** files (and `.dev.vars.example` for the worker) listing every required variable with placeholder values.
- Client-exposed variables use the `VITE_` prefix.

### Code quality
- Reusable components and utilities; **no duplicate code**.
- Small, focused modules with clear names.
- Handle loading, empty, and error states in the UI.
- Validate inputs at API boundaries.

## 4. UI / UX

- **Responsive and mobile-first** — many farmers use phones on slow connections.
- **Earthy agricultural theme**: greens and warm neutrals (soil browns, wheat/sand tones). Define colours in the Tailwind config as theme tokens rather than scattering hex values.
- Clean, professional, accessible (semantic HTML, sufficient contrast, labelled form controls).
- Advice and alerts should be clear, plain-language, and actionable (what to do, when, and why).

## 5. Working Rules

- **Build one module at a time.** Complete only the module requested.
- **Do not build features that were not asked for.** No speculative extras, roles, or pages.
- The user may provide requirements incrementally. Deliver a complete, professional implementation of the current request, then adapt it when they provide feedback. Do not block on unspecified details unless a consequential choice must be clarified.
- Follow the architecture above; do not introduce alternative frameworks, backends, or paid services without being asked.
- When a request is ambiguous, prefer the simplest solution consistent with these instructions.
