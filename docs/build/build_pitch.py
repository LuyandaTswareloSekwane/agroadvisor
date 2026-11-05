import os
import docbase as d
from docbase import para, bullet, heading, table, figure, page_break, CENTER
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

ROOT = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs"
DOCX = os.path.join(ROOT, "final", "AgroAdvisor_Presentation_Guide.docx")
PPTX = os.path.join(ROOT, "final", "AgroAdvisor_Pitch_Deck.pptx")

# (title, on-slide bullets, what to say)
SLIDES = [
    ("AgroAdvisor", ["Helping small-scale farmers prepare for severe weather", "NPRJ740 Final Project | Sol Plaatje University"],
     "Introduce yourself and the one-line purpose: AgroAdvisor reads the weather for one farmer's farm and tells them what to do, and when."),
    ("The problem", ["Many small-scale farmers have little access to timely, personal advice", "Weather apps show numbers, not what to do on a farm", "Food prices and farm risk are rising"],
     "Use the Statistics South Africa figure and the other sources exactly as cited in the report (Executive Summary and Problem Statement). Do not quote any number that is not in the References."),
    ("Why now: climate risk", ["A strong El Niño has been forecast for 2027 [[check the source cited in the report is current]]", "Heat, drought and storms hit small farms hardest", "Prepare before the event, not after"],
     "Tell the story you wrote: when conditions turn, farmers who prepared can feed themselves instead of waiting for help. Say the forecast is a prediction and name the source."),
    ("The solution", ["Interprets weather for one farm's crops and animals", "Seven-day outlook with plain-language advice", "Severe-weather warning: what to do, when, why", "Learn, farm memory, community notes"],
     "Stress: it is not a weather display. Every weather figure leads to an interpretation, advice or an alert."),
    ("Scope: what is included", ["Accounts (email, Google)", "Farm profile, photo ID, plot walker", "Weather advice and warnings (voice)", "Learn, memory, community map, 5 languages"],
     "State what is deferred honestly: background push (FR-17), Microsoft sign-in, seasonal month-by-month advice. Anything marked Included you must be ready to demo."),
    ("Architecture", ["React + Vite + Tailwind client", "Hono Worker on Cloudflare (API)", "Firebase Auth + Firestore (rules enforce access)", "Open-Meteo, Gemini, Azure Speech, YouTube, OpenStreetMap"],
     "Walk the deployment diagram (report 5.2). The browser talks to Firestore directly under security rules, and to the Worker for weather, vision and speech."),
    ("How the warning works", ["Worker fetches Open-Meteo forecast for the farm location", "Client rules compare it with the knowledge base thresholds", "Heat >= 35 C, frost <= 2 C, rain >= 50 mm, gusts >= 60 km/h, storm codes", "Pop-up only if due today or tomorrow"],
     "Thresholds live in config/knowledge-base/weather-risks.ts, each with a comment explaining the agronomic reason. The advice engine is rule-based and explainable. Gemini is used only for photo identification."),
    ("Security and data", ["Firestore rules: each farmer reads only their own farm and memory", "Worker verifies the Firebase ID token with jose", "Secrets only in .env and Wrangler secrets", "Community notes: 25 km limit, hidden after 2 reports"],
     "Be ready to show a rules denial (demo script, check 3)."),
    ("Live demo", ["Sign in", "Farm profile", "Weather advice and warning", "Learn / Memory / Community", "Lecturer-selected check"],
     "Follow section 3 of the guide. Keep to the order. Have the warning trigger prepared in advance (section 4)."),
    ("Testing and evidence", ["Build and type checks pass", "6 rule tests and 15 unit tests pass", "Unauthenticated API checks return 401/404", "Live form-validation test passed"],
     "Say clearly what was NOT tested: authenticated API calls by script, wrong-password screen, load time, public deployment (report 3.4 and 7.4)."),
    ("Limitations", ["Runs locally, not publicly deployed", "5 npm audit findings to fix", "Rule-based advice, limited crop/animal list", "Demo data must be removed before real use"],
     "Owning limitations earns credit under the Technical Defence criterion."),
    ("Evaluation against success criteria", ["See report section 9", "Met / partly met / not met, with reasons"],
     "Read the verdicts straight from section 9 of the report. Do not upgrade any result."),
    ("Next steps", ["Deploy to Cloudflare Pages and Workers", "Background push with a service-account secret", "Seasonal outlook source for month-by-month advice", "Field testing with real farmers"],
     "Close with the story: help farmers farm better and become self-reliant when hard seasons arrive. Invite questions."),
]

DEMO = [
    ("Principal end-to-end workflow (about 4 minutes)", [
        "Register or sign in with the demo account (have credentials ready; the login page must already be open).",
        "Open Farm profile: show name, nearest town, map location, crops, livestock. Save.",
        "Open the Dashboard: current weather beside the farm name, seven-day outlook and risk notes.",
        "Show the warning (use the trigger in section 4). Click the speaker to hear it read aloud. Dismiss it.",
        "Learn: open a lesson, mark it complete. Farm memory: show it recorded and the weekly summary.",
        "Community: add a note inside 25 km and see it on the map.",
    ]),
    ("Lecturer-selected checks: have one ready for each type", [
        "Validation: on the farm form, clear the farm name or enter size 0 or a negative number, then save. Expect a field error and nothing saved.",
        "Access control: with the Firebase console open, show firestore.rules (farms/{uid} read only if owner). Optional live proof: run the rules test, `npm run test:firestore-rules` in the client folder (needs the Firebase emulator, which needs Java; try it once beforehand).",
        "Alternative flow: photo ID fails or is not configured, then type the crop name instead. Or switch language to isiZulu and show the interface change.",
        "Boundary: add a community note farther than 25 km from the farm (rejected). Report a note twice (second says already reported). A second different farmer's report hides it.",
        "Failure condition: stop the Worker (Ctrl+C in its terminal) and reload the dashboard. Expect an error message with a retry, not a blank page. Restart the Worker afterwards.",
    ]),
]

TRIGGER_STEPS = [
    "Open config/knowledge-base/weather-risks.ts.",
    "Change highTemperatureC from 35 to a value below today's current temperature, for example 10. (For a cold warning, raise lowTemperatureC from 2 to 40.) Save the file.",
    "The client dev server (npm run dev in client, port 5175) reloads by itself. Reload the dashboard if it does not.",
    "If the pop-up was already dismissed this session, open the dashboard in a new private window, or clear the session key agroadvisor-dismissed-warning:<your uid> (DevTools, Application, Session Storage).",
    "You should see the coloured warning and, because the heat is today, the pop-up. The speaker button reads it aloud.",
    "After the demo, change the value back to 35. This matters: the threshold is real agronomic knowledge.",
]

STACK = [
    ["Sign-in and registration", "Firebase Authentication (modular SDK). Email/password and Google popup. After registering, a farmers/{uid} document is written.", "client/src/services/authService.ts, farmerService.ts, context/AuthProvider.tsx, components/auth/*"],
    ["Route protection", "ProtectedRoute redirects signed-out users to login. This is convenience only: Firestore rules are the real protection.", "client/src/router.tsx, components/auth/ProtectedRoute.tsx"],
    ["Farm profile", "Form state and validation in utils, saved to farms/{uid} with setDoc/updateDoc through a service. Photo stored as a small JPEG data URL, validated by the rules.", "components/farm/FarmProfileForm.tsx, utils/farmForm.ts, validation.ts, services/farmService.ts"],
    ["Location picker and plot walker", "Leaflet with OpenStreetMap tiles. Device geolocation. Plot area computed from walked GPS points; points are not saved.", "components/farm/LocationPicker.tsx, PlotSurvey.tsx, utils/plotMeasurement.ts, geolocation.ts"],
    ["Photo identification", "Browser sends the image to the Worker, which checks the Firebase token and image size (6 MB max) and asks Gemini, trying three models in turn. Farmer can always type a name.", "components/farm/ImageIdentifier.tsx, client services/visionService.ts, worker routes/vision.ts, services/visionService.ts"],
    ["Weather forecast", "Client calls GET /api/weather/forecast with the ID token. Worker verifies it with jose, reads the farm from Firestore REST using the user's own token, then calls Open-Meteo for that location.", "client services/weatherService.ts, workerApi.ts; worker routes/weather.ts, middleware/firebaseAuth.ts, lib/firestoreRest.ts, services/weatherService.ts"],
    ["Advice and seven-day outlook", "Rule-based engine in the client turns forecast + farm crops/livestock into advice, using thresholds from the knowledge base.", "client utils/weatherAdvice.ts, components/farm/WeeklyOutlook.tsx, WeatherOverview.tsx; config/knowledge-base/*.ts"],
    ["Severe-weather warning", "getWeatherAdvice builds alerts; getPrimaryWeatherAlert picks the soonest, critical first; isWeatherAlertImminent opens the pop-up only for today or tomorrow. Dismissal is kept in sessionStorage.", "client utils/weatherAdvice.ts, components/farm/WeatherAdvisory.tsx"],
    ["Voice read-aloud", "Browser speech synthesis; Afrikaans and isiZulu use Azure Speech through the Worker. The Azure key is a Worker secret.", "WeatherAdvisory.tsx, client services/speechService.ts, worker routes/speech.ts, services/speechService.ts"],
    ["Nearby temperature map", "Worker fetches a grid of temperatures from Open-Meteo; the client shades the map using the 10/25/32 C bands.", "worker routes/weather.ts (temperature-grid), services/regionalWeatherService.ts, components/community/CommunityMap.tsx"],
    ["Learn", "Firestore lessons query where reviewed == true and published == true. Video is embedded from YouTube. Completing a lesson writes a memory entry.", "pages/LessonsPage.tsx, components/lessons/*, services/lessonService.ts"],
    ["Farm memory", "Sub-collection farms/{uid}/memory with entries of type weather, planting, success or lesson; ordered by occurredAt; weekly summary query by date range.", "pages/FarmMemoryPage.tsx, services/farmMemoryService.ts"],
    ["Community notes", "communityObservations collection. Bounding-box query plus an exact distance filter (25 km). Report uses a transaction and a per-reporter document so one farmer cannot report twice; two reports set status to hidden.", "pages/CommunityPage.tsx, services/communityObservationService.ts"],
    ["Languages", "A central translation dictionary and a language context.", "client/src/i18n.ts, context/LanguageProvider.tsx"],
    ["API response shape and errors", "Every Worker response is { success, data, message } through ok()/fail() helpers with proper status codes.", "worker/src/lib/response.ts"],
    ["Security rules", "firestore.rules: owner-only farmers, farms and memory; lessons read-only for signed-in users; community notes with validated report-count updates.", "firestore.rules, client/tests/firestore.rules.test.mjs"],
]

QUERIES = [
    ["farmers", "farmers/{uid}", "uid, fullName, email, createdAt", "Query builder: collection farmers, field email == someone@example.com. Shows one account's profile."],
    ["farms", "farms/{ownerId}", "name, locationName, location.latitude/longitude, sizeHectares, crops[], livestock{}", "Filter locationName == the town. Filter sizeHectares > 5. Filter crops array-contains maize (the id used in config/knowledge-base/crops.ts)."],
    ["memory", "farms/{ownerId}/memory/{entry}", "type, title, note, occurredAt, createdAt, lessonId", "Open a farm, then its memory collection; filter type == lesson. To search across all farms use Query builder with 'Collection group' set to memory (the console may ask you to create an index)."],
    ["lessons", "lessons/{id}", "topicId, title, language, youtubeId, reviewed, published", "Filter published == true. Filter language == en."],
    ["communityObservations", "communityObservations/{id}", "type, details, location, authorId, reportCount, status, createdAt", "Filter status == hidden to show reported notes. Filter reportCount >= 1. Filter type == flooding."],
    ["communityReports", "communityReports/{reporterId}/reports/{observationId}", "created when a farmer reports a note", "Open a reporter's document to show their reports; proves one report per farmer."],
]

QA = [
    ("Is this AI?", "The advice is a transparent rule-based engine driven by documented thresholds, chosen so a farmer's advice can be explained and audited. AI (Gemini) is used only for photo identification. Say so plainly."),
    ("Why not Cloud Functions?", "The project is held to the free Firebase plan. The Worker provides the server side and cron-capable runtime instead."),
    ("How do you stop one farmer seeing another's farm?", "Firestore security rules check request.auth.uid against the document id. The Worker reads Firestore with the caller's own token, so the same rules apply."),
    ("Why are the thresholds in a config file?", "So agronomic knowledge can be reviewed and changed without touching engine code, and each rule documents its reason."),
    ("Why is background push not built?", "It needs a service-account key kept as a Worker secret and was deferred (FR-17). The report says so."),
    ("Where is the embedded-systems outcome?", "It does not apply to this project. Say so honestly instead of claiming it."),
    ("Was it deployed and load tested?", "No. It runs locally; deployment and performance were not tested (LIM-1, LIM-2)."),
    ("What would you do with the El Niño forecast?", "The current system gives seven-day advice. Month-by-month seasonal advice needs a seasonal-outlook data source and is future work (report 3.3)."),
]

CHECKLIST = [
    "Git: this folder is NOT a Git repository yet. The rubric awards marks for a repository with a tag or commit. Create a GitHub repository, push, tag a release (for example v1.0), and put the URL and commit in report section 11.1.",
    "Confirm no secret is committed: .gitignore already excludes .env, .dev.vars and service-account files. Check with a search before pushing.",
    "Fill the yellow placeholders in the report: name, student number, date, GitHub URL and commit, demo login, Learn-video review (LIM-6), interview sentence.",
    "The Microsoft sign-in button is visible but deferred. If you do not enable it, tell the assessor, or expect a lecturer to click it.",
    "Anything marked Included must work on the day: rehearse FR-05 plot walker, FR-06 photo ID, FR-10 temperature map, FR-16 languages and voice.",
    "Start both servers before presenting (Worker on 8787, client on 5175), sign in beforehand and keep the Firebase console open.",
    "Have internet: Open-Meteo, Firebase, Gemini and Azure all need it.",
    "Remove the temporary threshold change (heat back to 35) after the warning demo.",
]

# ------------------------------------------------------------------ Word guide
d.init("AgroAdvisor - Presentation Guide")
para("AgroAdvisor", bold=True, align=CENTER, size=24)
para("Presentation Guide", bold=True, align=CENTER, size=16)
para("Pitch deck script, technical walkthrough, live demo, Firebase queries and warning trigger", align=CENTER, italic=True)
para("")
para("This guide supports the 10 marks for presentation: overview and communication (1), the principal workflow (2), a lecturer-selected capability plus a validation, access-control, alternative-flow, boundary or failure condition (4), engineering decisions (1) and technical defence (2). Items in yellow need your confirmation. Nothing here claims a test that was not run.", size=10.5)

heading("1. Pitch deck: slide by slide", 1)
para("The same slides are in AgroAdvisor_Pitch_Deck.pptx with speaker notes.")
for i, (title, bl, say) in enumerate(SLIDES, 1):
    heading(f"Slide {i}: {title}", 2)
    for b in bl:
        bullet(b)
    para("Say: " + say, italic=True)

heading("2. Report-to-rubric check", 1)
para("Section numbers in the report now match the numbers the rubric cites (3.2 scope, 4.1 to 4.4 requirements, 5.2 to 5.8 design, 6.1 codebase, 7 verification, 8 setup, 11.1 repository).")
table(["Rubric area", "Where in the report", "State"], [
    ["Context, problem, purpose, success criteria", "1, 2, 2.3", "Covered"],
    ["Solution overview, scope, context diagram", "3.1 to 3.4, Figure 1", "Covered"],
    ["SRS: IDs, MoSCoW, release status, rules, acceptance", "4.1 to 4.4", "Covered"],
    ["System design (use cases, architecture, decisions, class, UI, data, security, deployment)", "5.1 to 5.8", "Covered; models were redrawn from the final system"],
    ["Implementation documentation", "6.1 to 6.4", "Covered"],
    ["Verification and testing, defects", "7.1 to 7.4", "Covered; untested items are listed as limitations"],
    ["Setup and evaluation", "8, 9", "Covered"],
    ["References and consistency", "10", "Covered; check every citation opens"],
    ["Repository, tag or commit", "11.1", "NOT DONE: no Git repository exists yet"],
    ["Placeholders", "Cover, 11.1, 8.4", "Yellow items still need you"],
], widths=[7.0, 4.0, 5.0], size=9)
para("Earlier phase documents (1 to 3) use their own requirement numbering style (FR1 style) and were not rebuilt. If an assessor compares them with the final report, point to the final report as the authoritative set, or tell me and I will align the IDs.", size=10)

heading("3. Live demo script", 1)
for title, steps in DEMO:
    heading(title, 2)
    for s in steps:
        bullet(s)

heading("4. How to trigger the severe-weather warning manually", 1)
para("The warning normally appears by itself when the forecast for the farm crosses a threshold and the event is today or tomorrow. In a mild week nothing crosses, so for the demo you lower a threshold. This is honest and easy to explain: all thresholds live in the knowledge base, not in the engine.")
for i, s in enumerate(TRIGGER_STEPS, 1):
    bullet(f"{i}. {s}")
para("Do I know this works? Reading the code, the alert is produced when current or daily temperature is at or above highTemperatureC, and the pop-up opens if the date is today or tomorrow, so a low threshold must trigger it. I could not sign in to the browser to watch it live, so rehearse it once before presenting.", size=10)
para("What to say: 'Today is mild, so I lowered the heat limit in the knowledge base to simulate a hot day. The real limit is 35 degrees Celsius.'")
para("Alternative that needs no code edit: change the farm's location to a genuinely hot area on the farm profile page. It depends on the real forecast, so it is not reliable on the day.", size=10)

heading("5. Tech stack: how each function is built", 1)
para("Paths are relative to the client or worker folders where shown. Frontend: React 19, Vite 8, Tailwind 4, React Router, TypeScript strict, Leaflet. Backend: Hono 4 on a Cloudflare Worker with jose for token verification. Data: Firebase Authentication and Cloud Firestore (free plan).", size=10)
table(["Function", "How it works", "Where"], STACK, widths=[3.0, 8.0, 5.0], size=8.5)

heading("6. Firebase: queries to be ready for", 1)
para("In the Firebase console open Firestore Database, then Data. Use Query builder (the funnel or 'Query builder' tab) to pick a collection and add field filters; there is no SQL. Use Authentication, then Users, to show registered accounts. The 15 sample farmers have IDs starting with demo-; use the document list to show them, and confirm in the console how your version filters by document ID [[verify on the day]].")
table(["Collection", "Path", "Fields", "Example query to run"], QUERIES, widths=[2.6, 4.0, 4.2, 5.2], size=8.5)
para("Rules check you can speak to: the same query from another farmer's signed-in session is denied for farms and memory, because the rules require request.auth.uid to equal the document owner. The Firebase console itself bypasses rules because you are the project owner; say that if asked.", size=10)

heading("7. Questions you should expect", 1)
table(["Question", "Honest answer"], [list(q) for q in QA], widths=[5.0, 11.0], size=9)

heading("8. Before the day", 1)
for c in CHECKLIST:
    bullet(c)

d.doc.save(DOCX)
print(DOCX)

# ------------------------------------------------------------------ PowerPoint
GREEN, SAND, DARK = RGBColor(0x2E, 0x5E, 0x3A), RGBColor(0xF5, 0xEE, 0xDC), RGBColor(0x2B, 0x2B, 0x22)
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.33), Inches(7.5)
blank = prs.slide_layouts[6]
for i, (title, bl, say) in enumerate(SLIDES, 1):
    s = prs.slides.add_slide(blank)
    bg = s.background.fill
    bg.solid()
    bg.fore_color.rgb = GREEN if i == 1 else SAND
    fg = RGBColor(255, 255, 255) if i == 1 else DARK
    tb = s.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(1.2))
    tf = tb.text_frame
    tf.text = title
    r = tf.paragraphs[0].runs[0]
    r.font.size, r.font.bold = Pt(48 if i == 1 else 38), True
    r.font.color.rgb = fg if i == 1 else GREEN
    body = s.shapes.add_textbox(Inches(0.9), Inches(2.0), Inches(11.5), Inches(4.8)).text_frame
    body.word_wrap = True
    for j, b in enumerate(bl):
        p = body.paragraphs[0] if j == 0 else body.add_paragraph()
        p.text = ("" if i == 1 else "\u2022 ") + b
        p.space_after = Pt(14)
        p.runs[0].font.size = Pt(26 if i > 1 else 24)
        p.runs[0].font.color.rgb = fg
    s.notes_slide.notes_text_frame.text = say
prs.save(PPTX)
print(PPTX)

