# AgroAdvisor

AI-powered farm advisory platform for smallholder farmers. It interprets weather forecasts together with each farmer's farm profile to produce personalised, actionable advice and severe-weather alerts.

## Structure

| Folder     | What it is                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| `client/`  | React + TypeScript + Vite + Tailwind web app (deployed to Cloudflare Pages) |
| `worker/`  | Cloudflare Worker API (Hono + TypeScript), all routes under `/api`          |
| `scripts/` | Local Node scripts for seeding Firestore (added in a later module)          |

## Prerequisites

- Node.js 20 or newer

## Firebase project setup

1. Create a Firebase project on the free Spark plan.
2. In **Authentication > Sign-in method**, enable **Email/Password**, **Google**, and **Microsoft**. For Microsoft, register an app with Microsoft Entra ID and add its client ID and secret in Firebase's Microsoft provider settings. Add local and deployed web domains to Firebase Authentication's authorized domains. The app offers only providers enabled in this Firebase project; it cannot accept every identity provider automatically.
3. Create a **Cloud Firestore** database and publish the repository's `firestore.rules`.
4. Register a Web app under **Project settings > General > Your apps**. Copy its Firebase config into `client/.env` using `client/.env.example`.
5. In **Project settings > Cloud Messaging > Web configuration**, create a Web Push certificate and use its VAPID key when web push is implemented.
6. Set the Worker Firebase project ID in `worker/.dev.vars`. Create a Google service account with the minimum Firestore permissions needed by future scheduled jobs; keep its email and private key in local `.dev.vars` and production Wrangler secrets. Never use a service-account key in the client.
7. To enable free-tier Afrikaans and isiZulu warning speech, create an Azure Speech resource on the **F0 (free)** tier and add its key and region to `worker/.dev.vars`. Do not change the resource to Standard (S0) unless you explicitly intend to use billable speech.

The client uses the Firebase modular SDK. The Worker verifies Firebase ID tokens for user requests and its Firestore REST helpers accept either the user's token or a service-account access token. Do not expose service-account credentials to the browser.

The authenticated `GET /api/weather/forecast` endpoint reads the caller's `farms/{uid}` location using that same Firebase ID token, then returns current conditions and a seven-day local-time Open-Meteo forecast. The authenticated `GET /api/weather/temperature-grid?latitude=…&longitude=…` endpoint returns nearby temperatures for the farm-location map overlay. Both responses use `{ success, data, message }`; the forecast includes WMO condition descriptions alongside the measurements. A farm profile must exist before requesting its forecast.

On the farm map, temperature-band controls highlight nearby forecast points; selecting a point shows its estimated temperature and approximate coordinates. These are forecast-grid estimates, not exact field readings or named locations.

Farmers may optionally add a profile photo. The client resizes it to JPEG and stores it on the owner's farm document, capped at 100,000 characters; no separate paid storage service is used.

Farmers can identify crops, products, and livestock by taking or uploading a photo in the farm profile. The authenticated Worker sends the image to Gemini for recognition and returns a high-confidence name, uncertain alternatives, or an unknown result with a manual-entry fallback. Photos must be JPEG, PNG, or WebP and no larger than 6 MB. Images are sent to Google's Gemini API for analysis; review Google's current privacy terms, API limits, and pricing before enabling this feature.

The recognition status uses the model's estimated confidence (80% or higher: identified, 50–79%: uncertain, below 50% or not relevant: unknown); this is an estimate, not a calibrated accuracy guarantee. The result is shown for farmer confirmation before it is added to the farm profile.

The dashboard checks current and seven-day forecasts for high heat, very low temperatures, heavy rainfall, damaging gusts, and thunderstorms, and presents actionable on-screen warnings. Its seven-day outlook is forecast-only (not a record of past farm activity) and provides expandable actions for risk days. It foregrounds the soonest risk, opens an interruptive warning only for a hazard due today or tomorrow, and summarizes additional risk days rather than listing every forecast alert. Weather risk thresholds live in `config/knowledge-base/weather-risks.ts`; warnings are precautionary and custom crop names receive general farm-protection guidance.

The client includes English, Afrikaans, isiZulu, Sesotho, and Setswana interface and weather-advice translations. The selected language is stored in the browser on that device. Severe-weather dialogs attempt a spoken warning when opened and provide a listen/stop control. Afrikaans and isiZulu can use Azure Speech's F0 (free) Neural TTS tier; Sesotho, Setswana, and English use an installed browser voice when available. If speech is unavailable, the app keeps the complete warning on screen instead of silently reading it in the wrong language. Cloud speech sends the warning text, including the farm name and location, to Azure; configure it only if that is acceptable for your deployment.

Azure's published F0 allowance is 500,000 Neural TTS characters per month and is limited to 20 speech transactions per minute. Keep the Speech resource on the F0 tier to avoid selecting a billable tier. Azure currently provides the app's cloud voices for Afrikaans (`af-ZA-AdriNeural`) and isiZulu (`zu-ZA-ThandoNeural`); it does not list Sesotho or Setswana voices.

## Curating video lessons

The authenticated farmer-facing `/lessons` page reads curated documents from the top-level Firestore `lessons` collection. There is no client-side admin role or lesson editor: manage the collection in the Firebase console. Firestore rules let signed-in farmers read only documents with both `reviewed: true` and `published: true`; client writes are denied. Publish the latest `firestore.rules` before using this collection.

Each lesson document must include:

- `topicId`: lowercase hyphenated grouping key; `topicLabel`: an English string (legacy fully localized values are also accepted).
- `title` and `summary`: English strings; titles are limited to 160 characters and summaries to 500 (legacy fully localized values are also accepted).
- `youtubeId`: the 11-character video ID only; the app builds the official YouTube embed and source-video links from it.
- `language`: the video's spoken language. The current lesson catalog is intended to use English videos; `durationSeconds`: a positive integer no greater than 600 (videos may be up to 10 minutes).
- `sourceChannel`: the channel name shown next to the source-video link.
- `keySteps`: one to eight English `{ icon, text }` steps (legacy fully localized values are also accepted). Icons must be one of `sun`, `water`, `cover`, `soil`, `leaf`, `animal`, `fence`, or `clock`.
- `visualOnly`: whether the clip can be followed visually; `fallbackPriority`: a non-negative integer, lower values preferred when a farmer's language is unavailable.
- `reviewed` and `published`: both must be set to `true` only after a curator has checked the video, English summary, and steps against the video. Draft and unreviewed content stays hidden from farmers.

Lesson titles, summaries, and key steps are shown in English regardless of the interface language; the page labels this clearly. YouTube iframes are not created until the farmer chooses to load a video. Add a visible source link for every lesson and verify instructional claims before publishing. No lesson videos are currently seeded, so the page remains in its empty state until a curator publishes verified lesson records in Firestore. See [SOURCES.md](./SOURCES.md) for the video embed source and curation status.

## Farm memory

The authenticated `/memory` page keeps private farmer-entered records in the `farms/{uid}/memory/{entryId}` Firestore subcollection. Records can describe a past weather event, planting, what worked, or a completed lesson. Each record stores a short title, optional note, event date, and creation timestamp; lesson records also store the curated lesson ID. Farmers can remove individual records, but records are not editable.

The weekly view uses the farm profile's existing name, location, and area and summarizes only records entered for the current local calendar week. It does not infer historical weather from forecasts or present farmer-reported weather notes as measurements. The page shows up to 100 current-week records and paginates the 30 most recent records at a time. Completing a lesson is an explicit farmer action on its lesson card; each lesson is recorded once per farm. Firestore rules restrict memory access to the signed-in owner and deny updates.

Farm memory contains personal records, not agronomic advice, and adds no external research claims. See `firestore.rules` for the private subcollection rules.

## Community local knowledge

The authenticated `/community` page shows farmer-reported flood, frost, and other local observations around the farm's saved location. Farmers place a pin within 25 km of their farm and can add a short note. Pins and notes are shared with other signed-in farmers in the same nearby area; the page warns farmers not to include names or private details. Every note is labeled **Farmer-reported** and is not presented as researched advice.

New notes appear immediately. A different signed-in farmer can report a note once; after two distinct reports, a Firestore transaction automatically hides it from the community map. Authors can remove their own visible notes, but cannot edit published notes. Firestore rules validate note fields and the farm-relative location, and ensure that a report and its counter update occur together, preventing duplicate reports and client-forged report counts. The nearby-map query uses the composite index in `firestore.indexes.json`; deploy both Firestore rules and indexes with `firebase deploy --only firestore` before using this feature.

Map tiles use OpenStreetMap with visible attribution. See `SOURCES.md` for the licensing and tile-policy references. Community observations are farmer-generated, so they do not add a research citation or location-specific recommendation.

## Local development

Install dependencies once:

```bash
npm install --prefix worker
npm install --prefix client
```

Run the API and the web app in two terminals:

```bash
npm run dev --prefix worker   # wrangler dev, API on http://127.0.0.1:8787
npm run dev --prefix client   # Vite app on http://localhost:5173 (proxies /api to the Worker)
```

Check the API: <http://127.0.0.1:8787/api/health>

The Vite proxy is for local development. Set `VITE_WORKER_URL` to the deployed Worker URL in the client hosting environment for production. Configure `FIREBASE_PROJECT_ID` and `ALLOWED_ORIGIN` as Worker variables for the production project. Store `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, and `GEMINI_API_KEY` as Wrangler secrets in production, for example:

```bash
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --config worker/wrangler.jsonc
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY --config worker/wrangler.jsonc
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.jsonc
npx wrangler secret put AZURE_SPEECH_KEY --config worker/wrangler.jsonc
npx wrangler secret put AZURE_SPEECH_REGION --config worker/wrangler.jsonc
```

## Configuration

- Client: copy `client/.env.example` to `client/.env`.
- Worker: copy `worker/.dev.vars.example` to `worker/.dev.vars`. Production secrets are set with `wrangler secret put <NAME>`.
- Add a Gemini Developer API key to `worker/.dev.vars` as `GEMINI_API_KEY` for local image recognition. Never place this key in the client environment or commit it.
- Add `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` to `worker/.dev.vars` to enable Azure's F0 Afrikaans/isiZulu warning speech. In production, set them as Wrangler secrets. The region is not confidential, but using a secret keeps the deployment instructions consistent.
- In the Firebase console, enable Email/Password, Google, and Microsoft under Authentication, create a Cloud Firestore database, and copy the web app config into `client/.env`.
- Publish the farmer-only Firestore rules in `firestore.rules` from the Firebase console, or deploy them with `firebase deploy --only firestore:rules` using the Firebase CLI.
- New farmer registrations save a private profile in `farmers/{uid}`. The Firestore rules restrict reads and writes to the authenticated owner.

Never commit `.env` or `.dev.vars` files.

## Checks

```bash
npm run typecheck --prefix worker
npm run build --prefix client
npm run test:firestore-rules --prefix client
```

The Firestore rules test command starts the local Firestore emulator and checks community-report transactions against `firestore.rules`. It requires Java 17 or newer.
