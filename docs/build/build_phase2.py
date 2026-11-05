import os
import docbase as d
from docbase import para, bullet, heading, table, figure, page_break

ROOT = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs\phase2"
OUT = os.path.join(ROOT, "AgroAdvisor_Phase2_Document.docx")
img = lambda n: os.path.join(ROOT, n)

d.init("AgroAdvisor - Phase 2")
d.cover("PHASE 2", "System Requirements, Modelling and Project Management",
        "Phase 2: System Requirements, Modelling and Project Management", "DR TITE TUYIKEZE")

# ------------------------------------------------------------------ 1 requirements
heading("1. System Functional and Non-Functional Requirements", 1)
para("AgroAdvisor is built for one type of user: the smallholder farmer. There are no administrator, buyer or other roles. "
     "The system interprets weather data together with each farmer's farm profile (location, crops, livestock) to give personal "
     "advice and severe-weather warnings, instead of only showing the weather.")
para("Priority uses the MoSCoW scale: M = Must have, S = Should have, C = Could have. Status shows what exists in the "
     "current version of the system.")

heading("1.1 Product features (functional requirements)", 2)
table(
    ["ID", "Requirement", "Priority", "Status"],
    [
        ["FR1", "A farmer can register with full name, email and password, and can sign in with email and password.", "M", "Built"],
        ["FR2", "A farmer can sign in with a Google account. A Microsoft sign-in button exists but the provider is not yet enabled in Firebase.", "S", "Google built; Microsoft pending"],
        ["FR3", "A farmer can create and edit one farm profile: name, nearest town, location on a map, size (acres or hectares), crops and livestock with counts, and an optional photo.", "M", "Built"],
        ["FR4", "A farmer can set the farm location by tapping a map or using the device location.", "M", "Built"],
        ["FR5", "A farmer can estimate plot size by walking the boundary with the device GPS. GPS points are not saved.", "C", "Built"],
        ["FR6", "A farmer can add a crop or animal by taking or choosing a photo, which the system identifies, or by typing its name.", "S", "Built"],
        ["FR7", "The dashboard shows current weather for the farm (temperature, conditions, high and low, humidity, feels-like) next to the farm name.", "M", "Built"],
        ["FR8", "The system shows a 7-day farm outlook with an interpretation and a risk note for each day, based on the farm's crops and livestock.", "M", "Built"],
        ["FR9", "The system shows a severe-weather warning (heat, frost, heavy rain, strong wind, storm) with what to do, when and why, and can read the warning aloud.", "M", "Built"],
        ["FR10", "The farm profile map shades nearby estimated temperatures (cool, mild, warm, hot).", "C", "Built"],
        ["FR11", "A farmer can browse reviewed and published video lessons grouped by topic, with short key steps.", "M", "Built"],
        ["FR12", "A farmer can mark a lesson complete. The completion is saved in the farm memory.", "S", "Built"],
        ["FR13", "A farmer can record a weather event, planting or what worked, and see a weekly summary and recent entries. Entries can be removed.", "S", "Built"],
        ["FR14", "A farmer can add a local observation (flooding, frost or other) within 25 km of their farm and see visible notes nearby on a map.", "S", "Built"],
        ["FR15", "A farmer can report another farmer's note. A note is hidden after two different farmers report it. The author can remove their own note.", "S", "Built"],
        ["FR16", "A farmer can change the interface language (English, Afrikaans, isiZulu, Sesotho, Setswana).", "S", "Built"],
        ["FR17", "The system sends a background push notification when severe weather is forecast, even if the app is closed.", "C", "Not built: needs a service-account key"],
    ],
    widths=[1.2, 10.2, 1.6, 3.0],
    size=9,
)

heading("1.2 System non-functional requirements", 2)
para("The targets below are design targets. They have not yet been measured in a formal test, so no measured result is claimed.")
table(
    ["ID", "Quality", "Requirement (design target)"],
    [
        ["NFR1", "Reliability", "If the weather service or the Worker is unavailable, the dashboard shows a clear error with a retry option and does not show wrong data. Saved farm data is never changed by a failed forecast request."],
        ["NFR2", "Availability", "The client (Cloudflare Pages), the Worker (Cloudflare) and the database (Firebase) are managed cloud services, so no server needs to be maintained by the farmer or the developer. Availability is therefore that of these providers."],
        ["NFR3", "Security", "Every farmer can read and write only their own farmer, farm and memory data. Firestore Security Rules enforce this on the server. The Worker verifies the Firebase ID token on each request. Secrets are kept in environment files and Wrangler secrets, never in source code."],
        ["NFR4", "Security", "Community notes contain no names. Direct database writes are limited by rules: note length, 25 km radius, one report per farmer per note, and report counts that cannot be forged. Six automated rule tests cover these cases."],
        ["NFR5", "Maintainability", "TypeScript strict mode with no 'any'. Firestore access only through service modules. All agronomic thresholds live in one knowledge-base file with a comment explaining each rule. The worker uses one shared response helper."],
        ["NFR6", "Portability", "The client is a web application that runs in any modern browser on phone or computer. No app-store installation is needed."],
        ["NFR7", "Performance", "The interface is mobile-first and the build is split into smaller files so the first screen loads quickly on slow mobile data. The map is loaded only when needed. Target: the dashboard shows weather soon after the forecast response arrives. [[Measure and record load times before submission.]]"],
        ["NFR8", "Usability", "Plain-language advice, large touch targets (buttons at least 44 px high), labelled form controls, sufficient colour contrast and a loading, empty and error state on every data screen."],
        ["NFR9", "Cost", "The system stays on free plans: Firebase Spark, Cloudflare free tier and Open-Meteo. No Cloud Functions are used."],
    ],
    widths=[1.4, 2.6, 12.0],
    size=9,
)

# ------------------------------------------------------------------ 2 modelling
heading("2. System Modelling", 1)
heading("2.1 Context diagram", 2)
para("The context diagram shows AgroAdvisor as one process, the farmer as the only user, and the external systems it exchanges data with.")
figure(img("context-diagram.png"), 14.5, "Figure 1: Context diagram of AgroAdvisor")

heading("2.2 Architectural design", 2)
para("AgroAdvisor uses a client-server model organised in three layers.")
table(
    ["Layer", "Components", "Responsibility"],
    [
        ["Presentation", "React + TypeScript + Tailwind client on Cloudflare Pages: pages, components, service modules, weather-advice rules",
         "Shows screens, collects input, reads and writes the farmer's own Firestore data through service modules, and turns forecast data into advice and warnings using the knowledge-base thresholds."],
        ["Application", "Hono API on a Cloudflare Worker: authentication middleware, routes under /api (health, weather, vision, speech), forecast and regional-grid services",
         "Verifies the Firebase ID token with the jose library, reads the farm profile with the farmer's own token, fetches forecasts, identifies photos and creates speech. Every response uses the shape {success, data, message}."],
        ["Data and external services", "Firebase Authentication, Cloud Firestore with Security Rules, Open-Meteo, Google Gemini, Azure Speech, YouTube, OpenStreetMap",
         "Stores accounts and data, enforces who may read or write each document, and supplies weather, image analysis, speech, video and map tiles."],
    ],
    widths=[3.0, 6.0, 7.0],
    size=9,
)
figure(img("architecture-diagram.png"), 15, "Figure 2: Three-layer architecture")
para("Key design decisions:")
bullet("The client reads and writes Firestore directly, so Security Rules are the real permission check, not client-side code.")
bullet("The Worker uses the farmer's own ID token when it reads the farm profile, so the same rules still apply.")
bullet("Thresholds (for example heat at 35 °C or more, frost at 2 °C or less) are stored in the knowledge-base file and not inside components.")

heading("2.3 System design models", 2)
heading("2.3.1 Use case diagram", 3)
para("The use cases below extend the Phase 1 diagram with photo identification (UC11) and plot measurement (UC12), which were added during development.")
figure(img("use-case-diagram.png"), 11.5, "Figure 3: Use case diagram")
table(
    ["Use case", "Description", "Main outcome"],
    [
        ["UC1 Register and log in", "Farmer creates an account or signs in with email or Google.", "Farmer reaches the dashboard."],
        ["UC2 Manage farm profile", "Farmer enters or edits farm name, location, size, crops and livestock.", "Advice is based on the saved profile."],
        ["UC3 View weather advice and 7-day outlook", "Farmer sees current weather and a daily outlook with risk notes.", "Farmer can plan the week."],
        ["UC4 Receive and hear a severe-weather warning", "System shows a warning with action, timing and reason, and can read it aloud.", "Farmer can protect crops and animals."],
        ["UC5 Watch a learning lesson", "Farmer opens a reviewed lesson and plays the video.", "Farmer learns a farm skill."],
        ["UC6 Mark a lesson complete", "Farmer confirms the lesson is done.", "A lesson entry is added to farm memory."],
        ["UC7 Record farm memory and view weekly summary", "Farmer saves a weather, planting or success note.", "Weekly counts and recent entries are updated."],
        ["UC8 Add a local observation", "Farmer places a pin within 25 km of the farm with a short note.", "Neighbours see the note on the map."],
        ["UC9 Report or remove a community note", "Farmer reports another farmer's note, or removes their own.", "Reported notes are hidden after two different reports."],
        ["UC10 Change interface language", "Farmer selects one of five languages.", "Screens appear in that language."],
        ["UC11 Identify a crop or animal from a photo", "Farmer takes a photo and the system suggests a name.", "The item can be added to the farm profile."],
        ["UC12 Estimate plot size", "Farmer walks the boundary with GPS on.", "Farm size field is filled in."],
    ],
    widths=[4.5, 7.0, 4.5],
    size=9,
)

heading("2.3.2 Activity diagram", 3)
para("The activity diagram shows the main flow of the system: from opening the dashboard to seeing advice or a severe-weather warning.")
figure(img("activity-diagram.png"), 9.5, "Figure 4: Activity diagram: view weather advice and warnings")

heading("2.3.3 State diagram", 3)
para("A community note moves through a small set of states. The rules allow a visible note to be reported only by another farmer and only once per farmer.")
figure(img("state-diagram.png"), 14, "Figure 5: State diagram of a community note")

heading("2.3.4 Class diagram", 3)
para("The classes mirror the data stored in Firestore. The farmer and the farm share the same identifier, so a farmer has exactly one farm.")
figure(img("class-diagram.png"), 15.5, "Figure 6: Class diagram")

heading("2.3.5 Sequence diagram", 3)
para("The sequence diagram shows how a forecast request travels through the client, the Worker, Firestore and Open-Meteo.")
figure(img("sequence-diagram.png"), 15.5, "Figure 7: Sequence diagram: load farm weather advice")

# ------------------------------------------------------------------ 3 project management
heading("3. Project Management", 1)
heading("3.1 Work breakdown", 2)
para("Each task lists its deliverables, milestone, resources, dependencies and constraints, and risks with contingencies. "
     "The durations are planned effort and must be replaced with the real dates of the project.")

TASKS = [
    ("T1 Requirements and interview plan",
     ["Interview questionnaire; list of problems; requirements list", "Phase 1 document approved", "Student, supervisor, farmers to interview", "None. Constraint: access to real farmers",
      "Risk: no farmer available. Contingency: use published sources and mark findings as unverified"]),
    ("T2 Design (UI, data, architecture)",
     ["Context, architecture, use case, class, sequence, state and activity models; data design; colour theme", "Phase 2 document approved", "Diagram tools, Figma or paper sketches", "Depends on T1",
      "Risk: design changes during build. Contingency: keep the design modular and update models afterwards"]),
    ("T3 Authentication and farmer profile",
     ["Register and login pages; Firebase project; farmer and farm services; farm profile form", "A farmer can register, log in and save a farm", "Firebase Spark plan, Google sign-in setup", "Depends on T2. Constraint: authorised domains must include the dev address",
      "Risk: login blocked by domain settings. Contingency: add the domain in Firebase and test email login first"]),
    ("T4 Weather advice and alerts",
     ["Cloudflare Worker with forecast route; weather-advice rules; dashboard; severe-weather warning; knowledge-base file", "Dashboard shows advice and a warning for a real farm", "Open-Meteo (free, no key), Wrangler, Hono", "Depends on T3",
      "Risk: weather service outage. Contingency: clear error message and retry button"]),
    ("T5 Learn page and farm memory",
     ["Lesson data and page; lesson completion; farm memory page with weekly summary", "A farmer can watch and complete a lesson and see it in memory", "Reviewed video list, Firestore", "Depends on T3",
      "Risk: unreviewed videos. Contingency: only show lessons marked reviewed and published; review videos before final submission"]),
    ("T6 Community map and security rules",
     ["Community map page; add, report and remove notes; Firestore Security Rules and indexes; rule tests", "Six rule tests pass and notes can be added and reported", "react-leaflet, OpenStreetMap, Firebase emulator, Java", "Depends on T3 (farm location)",
      "Risk: query needs an index that takes minutes to build. Contingency: deploy indexes early"]),
    ("T7 Photo identification and speech",
     ["Vision and speech Worker routes; photo scan in the farm form; spoken warnings", "A photo returns a crop or animal name; a warning can be played as audio", "Google Gemini and Azure Speech keys held as Wrangler secrets", "Depends on T4",
      "Risk: keys missing or quota used. Contingency: typed name entry and on-screen text still work"]),
    ("T8 Testing and fixes",
     ["Type checks, build, rule tests, manual browser tests of each page; fixes", "All pages work with a real account and sample data", "Browser, test accounts, seed data", "Depends on T3 to T7",
      "Risk: late bugs. Contingency: test each module when it is finished"]),
    ("T9 Documentation",
     ["Phase 1, Phase 2, Phase 3 and final report", "Each document handed in on time", "Word, diagram scripts, screenshots", "Runs alongside T1 to T8",
      "Risk: documents fall behind the system. Contingency: update documents at each milestone"]),
    ("T10 Deployment and final review",
     ["Client on Cloudflare Pages; Worker deployed; final demonstration", "System live and demonstrated", "Cloudflare account, Wrangler, Firebase deploy", "Depends on T8",
      "Risk: environment differences. Contingency: test the deployed build with a fresh account"]),
]
for title, (deliv, miles, res, dep, risk) in TASKS:
    heading(title, 3)
    table(["Item", "Detail"],
          [["Deliverables", deliv], ["Milestone", miles], ["Resources needed", res], ["Dependencies and constraints", dep], ["Risks and contingencies", risk]],
          widths=[4.2, 11.8], size=9)

heading("3.2 Gantt chart", 2)
para("The chart shows the planned order and overlap of the tasks in project weeks. [[Replace the week numbers with calendar dates agreed with the supervisor.]]")
figure(img("gantt-chart.png"), 16, "Figure 8: Gantt chart (planned schedule)")

heading("4. Conclusion", 1)
para("This document defines what AgroAdvisor must do and how it is built. The functional and non-functional requirements, the models and the "
     "work plan describe one system: a farmer-only advisory platform that turns weather data and the farm profile into advice and warnings. "
     "The one planned feature that is not yet built is background push notification (FR17).")

d.doc.save(OUT)
print(OUT)
