import os
import docbase as d
from docbase import para, bullet, heading, table, figure

ROOT = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs\phase3"
OUT = os.path.join(ROOT, "AgroAdvisor_Phase3_Document.docx")
shot = lambda n: os.path.join(ROOT, "screens", "composite-" + n + ".png")

d.init("AgroAdvisor - Phase 3")
d.cover("PHASE 3", "Graphical User Interface and Database Design",
        "Phase 3: Graphical User Interface and Database Design", "DR TITE TUYIKEZE")

heading("1. Graphical User Interface Design", 1)
para("This section shows every screen of the working AgroAdvisor system. The screenshots were taken from the running application on a "
     "phone-sized layout, because most farmers use phones. Long pages are cut into side-by-side panels that read left to right, then top to bottom. "
     "The logged-in screens show a sample farmer account with sample data.")
para("Common design features on all screens:")
bullet("Earthy theme: dark and light greens with warm sand and soil tones, defined once as theme tokens.")
bullet("A header with the logo, a language selector (five languages) and a simple navigation bar: Dashboard, My farm, Learn, Farm memory, Community map, Log out.")
bullet("Clear loading, empty and error messages and labelled form fields.")

SCREENS = [
    ("1.1 Home page", "home", 12.5,
     "Home page (public)",
     ["Purpose: introduces AgroAdvisor to a visitor before sign-up.",
      "Shows: a hero photo with a sample farm advisory card, the promise 'Weather shifts. Your farm gets a plan.', and three feature cards (advice for your farm, severe-weather alerts, built for the field).",
      "Actions: Create a free account; I already have an account; change language."]),
    ("1.2 Register page", "register", 9,
     "Register page",
     ["Purpose: creates a farmer account.",
      "Fields: full name, email address, password (at least 8 characters) and confirm password.",
      "Actions: Create account; continue with Google or Microsoft; link to log in. Errors appear under the form in plain language."]),
    ("1.3 Login page", "login", 9,
     "Login page",
     ["Purpose: lets a returning farmer sign in.",
      "Fields: email address and password.",
      "Actions: Log in; continue with Google or Microsoft; link to create an account."]),
    ("1.4 Dashboard", "dashboard", 12.5,
     "Dashboard: welcome banner, weather advice and 7-day farm outlook",
     ["Purpose: the farmer's daily view. It turns the forecast into advice for this farm.",
      "Top banner: welcome with the farmer's name, farm name, size, nearest town and an Edit farm button. A weather advice card next to it shows the current temperature, conditions, high and low, humidity and feels-like.",
      "7-day farm outlook: a progress bar of forecast days ready, a severe-weather warning strip (for example 'High heat expected' with the date), and one card per day with conditions, temperature range, rain chance and a risk note.",
      "Actions: Edit farm; Refresh advice; open a warning to read what to do and play it as audio."]),
    ("1.5 Severe-weather warning pop-up", "WARNING", 7.5,
     "Severe-weather warning pop-up (opens over the dashboard)",
     ["Purpose: stops the farmer and shows the most urgent hazard so it is not missed.",
      "When it is triggered: the dashboard loads the 7-day forecast for the saved farm location and compares each day with the thresholds in the knowledge-base file (heat at 35 degrees C or more, frost at 2 degrees C or less, heavy rain, damaging wind gusts of 60 km/h or more, thunderstorm). Each match becomes an alert for that day.",
      "The pop-up opens only for the most urgent alert, and only when that hazard is due today or tomorrow. Hazards further ahead appear as the red warning strip and as risk notes on the 7-day cards, without interrupting the farmer.",
      "Shows: a warning icon, the label Severe weather warning, the hazard (for example High heat expected), the date, a picture with one plain action (for example Move animals under a roof or tree with shade) and two buttons.",
      "Actions: Play or Stop voice warning reads the warning aloud (useful for farmers who prefer listening); I understand closes it. Escape also closes it.",
      "After it is closed it does not return for the same alert during the same browser session, so it does not nag the farmer. A new, different alert opens it again."]),
    ("1.6 My farm", "farm", 12.5,
     "My farm: farm profile form",
     ["Purpose: stores the information that advice is based on.",
      "Sections: farm photo (optional); farm details (name, size with acres or hectares); walk-the-boundary plot measurement; location map with a button to use the current location and a nearby-temperature layer (cool, mild, warm, hot); crops and products; livestock with a number kept for each animal.",
      "Crops and animals can be added by scanning a photo or by typing the name, and removed with one tap.",
      "Action: Save changes."]),
    ("1.7 Learn", "lessons", 16,
     "Learn: farm learning path",
     ["Purpose: short reviewed video lessons that farmers can use in the field.",
      "Shows: lessons grouped by topic (farm layout, fencing, frost protection, heat protection, planning a small farm). Each card has the title, length, a Reviewed badge, a language note, a short summary, key steps with icons and the video source.",
      "Actions: Load and watch video (the video loads only when pressed, which saves mobile data); Mark lesson complete; open the source on YouTube."]),
    ("1.8 Farm memory", "memory", 12.5,
     "Farm memory: weekly summary and add a memory",
     ["Purpose: a private record of what happened on the farm.",
      "Shows: this week's counts for weather events, plantings, what worked and lessons completed, then a form and a list of recent memories.",
      "Add a memory: choose the type, write a short title, pick a date and add an optional detail, then Save memory. A record can be removed if it was entered by mistake."]),
    ("1.9 Community map", "community", 16,
     "Community map: local field notes",
     ["Purpose: farmers near each other share short local observations (flooding, frost or other).",
      "Shows: the farmer's own farm and nearby notes within 25 km on a map with a colour legend, a form to add an observation, and a list of nearby notes with date and place.",
      "Actions: tap the map to place a pin, choose the type, add an optional short note, Share observation; Report a note (another farmer's) or Remove my note. A note is hidden after two different farmers report it."]),
]
for title, key, width, cap, lines in SCREENS:
    heading(title, 2)
    figure(os.path.join(ROOT, "screens", "warning-popup.png") if key == "WARNING" else shot(key), width, "Figure: " + cap)
    for ln in lines:
        bullet(ln)

# ------------------------------------------------------------------ database
heading("2. Database Design", 1)
para("AgroAdvisor stores its data in Cloud Firestore, a document database. Data is held in collections of documents instead of tables and rows, "
     "so the terms are used like this in this document:")
bullet("Entity = a collection (or sub-collection) of documents.")
bullet("Primary key (PK) = the document ID, which is unique inside its collection.")
bullet("Foreign key (FK) = a field that holds the ID of a document in another collection. Firestore does not enforce foreign keys, so the Security Rules and the application code keep them correct.")
bullet("Accounts (email, password, Google sign-in) are held by Firebase Authentication. The user ID (uid) it creates is the key that links all the data below to one farmer.")

heading("2.1 Entity relationship diagram", 2)
figure(os.path.join(ROOT, "erd.png"), 16, "Figure: Entity relationship diagram of the Firestore collections")
table(
    ["Relationship", "Cardinality", "How it is stored"],
    [
        ["farmers - farms", "1 to 1", "The farm document ID equals the farmer's uid, so a farmer has at most one farm."],
        ["farms - memory", "1 to many", "Memory entries are a sub-collection inside the farm document."],
        ["memory - lessons", "many to 0..1", "A memory entry of type 'lesson' keeps the lessonId of the lesson that was completed."],
        ["farmers - communityObservations", "1 to many", "authorId on the note holds the author's uid."],
        ["communityObservations - communityReports", "1 to 0..2", "A report document is stored under the reporter's uid with the note's ID as its document ID. A note is hidden at two reports."],
    ],
    widths=[5.0, 2.8, 8.2],
    size=9,
)

heading("2.2 Entities, attributes and data types", 2)

def entity(title, desc, rows):
    heading(title, 3)
    para(desc)
    table(["Attribute", "Data type", "Key", "Description and rules"], rows, widths=[3.4, 3.0, 1.8, 7.8], size=9)

entity("2.2.1 farmers", "Path: farmers/{uid}. One private profile per farmer. Only that farmer can read or write it.", [
    ["uid", "string", "PK", "Same as the Firebase Authentication user ID and the document ID."],
    ["fullName", "string", "", "Required, not empty."],
    ["email", "string", "", "Must equal the email of the signed-in account."],
    ["createdAt", "timestamp", "", "Set by the server when the profile is created and cannot change afterwards."],
])
entity("2.2.2 farms", "Path: farms/{ownerId}. One farm per farmer. Only the owner can read or write it.", [
    ["ownerId", "string", "PK, FK", "References farmers.uid. Also the document ID."],
    ["name", "string", "", "1 to 80 characters."],
    ["locationName", "string", "", "Nearest town or village, 1 to 100 characters."],
    ["location", "map { latitude: number, longitude: number }", "", "Latitude -90 to 90, longitude -180 to 180."],
    ["sizeHectares", "number", "", "Greater than 0 and at most 10 000. The form can show acres."],
    ["crops", "array of string", "", "Crop and product names, at most 50."],
    ["livestock", "map of string to number", "", "Animal name and the number kept, at most 50 animal types."],
    ["photoDataUrl", "string or null", "", "Optional JPEG picture as a data URL, at most 100 000 characters."],
    ["createdAt, updatedAt", "timestamp", "", "Server times. updatedAt must be the time of the write."],
])
entity("2.2.3 memory (sub-collection of farms)", "Path: farms/{uid}/memory/{entryId}. Private record of farm events. Entries cannot be edited, only created or deleted.", [
    ["entryId", "string", "PK", "Auto-generated document ID."],
    ["uid", "string", "FK", "Taken from the parent path: the farm and farmer that own the entry."],
    ["type", "string", "", "One of weather, planting, success, lesson."],
    ["title", "string", "", "1 to 160 characters."],
    ["note", "string", "", "0 to 500 characters."],
    ["occurredAt", "timestamp", "", "When it happened. Cannot be in the future."],
    ["createdAt", "timestamp", "", "Server time of saving."],
    ["lessonId", "string", "FK", "Only for type lesson: 1 to 200 characters, references lessons. Not allowed for other types."],
])
entity("2.2.4 lessons", "Path: lessons/{lessonId}. Curated video lessons. Signed-in farmers can read only lessons with reviewed and published both true. Farmers cannot write lessons: the curator adds them in the Firebase console.", [
    ["lessonId", "string", "PK", "Document ID, for example garden-planning-basics."],
    ["topicId, topicLabel", "string", "", "Topic key and the topic title shown on the Learn page."],
    ["title", "string", "", "Lesson title."],
    ["youtubeId", "string", "", "Identifier of the YouTube video."],
    ["language", "string", "", "Language of the lesson."],
    ["durationSeconds", "number", "", "Length of the video."],
    ["sourceChannel", "string", "", "Name of the channel that made the video."],
    ["reviewed, published", "boolean", "", "Both must be true before farmers can see the lesson."],
    ["visualOnly", "boolean", "", "True when the video can be followed without speech."],
    ["fallbackPriority", "number", "", "Order used to choose a lesson when several match."],
    ["summary", "string", "", "One-line summary."],
    ["keySteps", "array of map { icon: string, text: string }", "", "Short steps with an icon name."],
])
entity("2.2.5 communityObservations", "Path: communityObservations/{observationId}. Short local notes shared between farmers. Only visible notes can be listed.", [
    ["observationId", "string", "PK", "Auto-generated document ID."],
    ["authorId", "string", "FK", "References farmers.uid. Must equal the signed-in user when the note is created. Only the author can delete the note."],
    ["type", "string", "", "One of flooding, frost, other."],
    ["details", "string", "", "At most 240 characters. Required when type is other."],
    ["location", "map { latitude: number, longitude: number }", "", "Must be within 25 km of the author's farm."],
    ["status", "string", "", "visible when created; hidden after two reports."],
    ["reportCount", "number (integer)", "", "0 when created. Can only increase by 1 per report, to a maximum of 2."],
    ["createdAt", "timestamp", "", "Server time of creation."],
])
entity("2.2.6 communityReports (sub-collection)", "Path: communityReports/{reporterId}/reports/{observationId}. Proof that one farmer reported one note, so nobody can report the same note twice. Only the reporter can read it, and it cannot be changed or deleted.", [
    ["reporterId", "string", "PK, FK", "Part of the path. References farmers.uid."],
    ["observationId", "string", "PK, FK", "Document ID and field. References communityObservations. Together with reporterId it is unique."],
    ["createdAt", "timestamp", "", "Server time of the report."],
])

heading("2.3 Access rules summary", 2)
table(
    ["Entity", "Read", "Create", "Update", "Delete"],
    [
        ["farmers", "Owner", "Owner", "Owner", "Owner"],
        ["farms", "Owner", "Owner", "Owner", "Owner"],
        ["farms/memory", "Owner", "Owner", "Nobody", "Owner"],
        ["lessons", "Signed-in farmer (reviewed and published only)", "Nobody (curator in console)", "Nobody", "Nobody"],
        ["communityObservations", "Signed-in farmer (visible notes)", "Signed-in farmer with a farm, within 25 km", "Only to add one report", "Author"],
        ["communityReports", "Reporter", "Reporter, once per note", "Nobody", "Nobody"],
    ],
    widths=[3.6, 3.6, 3.6, 2.6, 2.6],
    size=9,
)

d.doc.save(OUT)
print(OUT)

