"""Diagrams that are new in the final report: deployment, second workflow (report a note) and application class diagram."""
import os
from matplotlib.patches import Rectangle, Circle, Polygon
from diagrams import canvas, box, arrow, save, uml_class, DARK, LIGHT, SAND, BROWN

OUT = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs\final"


def deployment(path):
    fig, ax = canvas(11, 7.6, 22, 15)
    def node(x, y, w, h, title, fc, ec):
        ax.add_patch(Rectangle((x, y), w, h, fc=fc, ec=ec, lw=1.6))
        ax.add_patch(Rectangle((x, y + h - 0.9), w, 0.9, fc="white", ec=ec, lw=1.2))
        ax.text(x + w / 2, y + h - 0.45, title, ha="center", va="center", fontsize=8.5, weight="bold")
    node(0.4, 8.0, 7.6, 6.4, "\u00abdevice\u00bb Developer / assessor computer", "#F4F4F4", "#555555")
    box(ax, 4.2, 12.3, 6.6, 1.5, "Web browser\n(phone-sized or desktop)", fc="#DCEBF7", ec="#2F5D8A", size=8)
    box(ax, 4.2, 9.9, 6.6, 1.7, "Vite dev server :5175\nReact client (npm run dev)", size=8)
    node(0.4, 0.5, 7.6, 6.4, "\u00abdevice\u00bb Same computer (local runtime)", "#F4F4F4", "#555555")
    box(ax, 4.2, 4.2, 6.6, 2.6, "Wrangler dev :8787\nHono Worker (workerd runtime)\nsecrets in worker/.dev.vars", size=8)
    box(ax, 4.2, 1.6, 6.6, 1.3, "Firebase emulator (Firestore only)\nused only for rule tests", fc="#FFFFFF", ec="#999999", size=7.5)
    node(10.4, 6.0, 11.2, 8.4, "\u00abcloud\u00bb Google Firebase (project agroadvisor-b3804, Spark plan)", SAND, BROWN)
    box(ax, 16.0, 12.0, 9.6, 1.7, "Firebase Authentication\n(email/password, Google)", fc="white", ec=BROWN, size=8)
    box(ax, 16.0, 9.6, 9.6, 2.2, "Cloud Firestore\n(farmers, farms, memory, lessons,\ncommunity) + Security Rules", fc="white", ec=BROWN, size=8)
    box(ax, 16.0, 7.3, 9.6, 1.2, "Public Google signing keys (JWKS)", fc="white", ec=BROWN, size=8)
    node(10.4, 0.5, 11.2, 5.0, "\u00abcloud\u00bb Third-party services (HTTPS)", SAND, BROWN)
    box(ax, 13.4, 2.4, 4.6, 1.6, "Open-Meteo\nforecast API", fc="white", ec=BROWN, size=8)
    box(ax, 18.6, 2.4, 4.6, 1.6, "Google Gemini\nphoto analysis", fc="white", ec=BROWN, size=8)
    arrow(ax, (4.2, 11.55), (4.2, 10.75), "HTTP", off=(0.7, 0), both=True)
    arrow(ax, (7.5, 12.3), (11.2, 12.0), "HTTPS: sign-in", off=(0, 0.35), both=True)
    arrow(ax, (7.5, 9.9), (11.2, 9.6), "HTTPS: Firestore SDK", off=(0, 0.35), both=True)
    arrow(ax, (1.2, 9.05), (1.2, 5.5), "/api via\nVite proxy", off=(1.0, 0), both=True)
    arrow(ax, (7.5, 5.0), (11.2, 7.3), "verify token; REST with user token", off=(-0.6, 0.9))
    arrow(ax, (7.5, 3.6), (11.2, 2.6), "forecast and photo requests", off=(0, -0.5))
    ax.text(11, -0.3, "The assessed system runs locally and talks to managed cloud services. Hosting on Cloudflare Pages and Workers is a deployment option that is not covered by this report.",
            ha="center", fontsize=6.8, style="italic")
    save(fig, path)


def activity_report(path):
    fig, ax = canvas(7, 10.4, 14, 21)
    cx = 5.5
    def node(y, text, w=7.4, h=1.1):
        box(ax, cx, y, w, h, text, size=8)
    def diamond(x, y, text):
        ax.add_patch(Polygon([(x, y + 1.0), (x + 2.3, y), (x, y - 1.0), (x - 2.3, y)], fc=SAND, ec=BROWN, lw=1.2))
        ax.text(x, y, text, ha="center", va="center", fontsize=7)
    ax.add_patch(Circle((cx, 20.4), 0.3, fc="black"))
    arrow(ax, (cx, 20.1), (cx, 19.5))
    node(18.9, "Farmer opens the Community map")
    arrow(ax, (cx, 18.35), (cx, 17.6))
    node(17.0, "Nearby visible notes (within 25 km) are listed")
    arrow(ax, (cx, 16.45), (cx, 15.7))
    node(15.1, "Farmer chooses Report on another farmer's note")
    arrow(ax, (cx, 14.55), (cx, 13.7))
    diamond(cx, 12.8, "Own note?")
    arrow(ax, (cx + 2.3, 12.8), (11.3, 12.8)); ax.text(cx + 3.0, 13.1, "Yes", fontsize=7)
    box(ax, 11.3, 11.4, 3.4, 1.5, "No Report button is\nshown; author can\nonly remove it", size=7)
    arrow(ax, (11.3, 12.8), (11.3, 12.15), None)
    arrow(ax, (cx, 11.8), (cx, 11.0)); ax.text(cx + 0.2, 11.4, "No", fontsize=7)
    diamond(cx, 10.0, "Already\nreported?")
    arrow(ax, (cx - 2.3, 10.0), (2.9, 10.0)); ax.text(3.6, 10.3, "Yes", fontsize=7)
    box(ax, 1.5, 10.0, 2.8, 1.5, "Rules reject the\nsecond report;\nshow message", size=7)
    arrow(ax, (cx, 9.0), (cx, 8.2)); ax.text(cx + 0.2, 8.6, "No", fontsize=7)
    node(7.6, "Save a report record and increase reportCount by 1\n(one transaction)", h=1.3)
    arrow(ax, (cx, 6.95), (cx, 6.2))
    diamond(cx, 5.2, "reportCount\n= 2?")
    arrow(ax, (cx - 2.3, 5.2), (1.9, 5.2)); ax.text(2.6, 5.5, "No", fontsize=7)
    box(ax, 1.9, 3.7, 3.4, 1.5, "Note stays visible;\nthank the farmer", size=7)
    arrow(ax, (1.9, 5.2), (1.9, 4.45), None)
    arrow(ax, (cx + 2.3, 5.2), (9.2, 5.2)); ax.text(cx + 3.0, 5.5, "Yes", fontsize=7)
    box(ax, 9.2, 3.7, 4.2, 1.5, "Status becomes hidden;\nnote disappears from\nthe map for everyone", size=7)
    arrow(ax, (9.2, 5.2), (9.2, 4.45), None)
    save(fig, path)


def sequence_report(path):
    fig, ax = canvas(11.5, 7.6, 24, 15.5)
    actors = [("Farmer", 2.4), ("React client", 7.4), ("communityObservation\nService", 13.0), ("Firestore\n+ Security Rules", 19.4)]
    for name, x in actors:
        box(ax, x, 14.4, 3.8, 1.3, name, size=8, bold=True)
        ax.plot([x, x], [13.7, 1.8], c="#999", lw=0.8, ls="--")
    steps = [
        (2.4, 7.4, 12.6, "tap Report on a note", False),
        (7.4, 13.0, 11.4, "reportCommunityObservation(ownerId, id)", False),
        (13.0, 19.4, 10.2, "transaction: create report + reportCount + 1", False),
        (19.4, 19.4, 8.8, "rules: not own note, not already reported,\ncount rises by exactly 1, max 2", None),
        (19.4, 13.0, 7.2, "success  or  PERMISSION_DENIED", True),
        (13.0, 7.4, 6.0, "done  or  friendly error message", True),
        (7.4, 7.4, 4.9, "refresh nearby notes (hidden ones removed)", None),
        (7.4, 2.4, 3.5, "confirmation and updated map", True),
    ]
    for a, b, y, label, dashed in steps:
        if dashed is None:
            ax.add_patch(Rectangle((a, y - 0.4), 0.35, 0.8, fc=LIGHT, ec=DARK))
            ax.text(a + 0.6, y, label, fontsize=7, va="center")
            continue
        arrow(ax, (a, y), (b, y), None, ls="--" if dashed else "-", color="black")
        ax.text((a + b) / 2, y + 0.35, label, fontsize=7, ha="center")
    save(fig, path)


def application_classes(path):
    LH = 0.52
    def height(ops, attrs=()):
        return 0.8 + LH * (len(attrs) + len(ops)) + 0.25
    rows = [
        ("CLIENT: services that read and write Firestore directly (Security Rules apply)", [
            ("AuthService", [], ["+ registerFarmer()", "+ loginFarmer()", "+ loginFarmerWithProvider()", "+ logoutFarmer()", "+ subscribeToAuthChanges()"], 5.2),
            ("FarmerService", [], ["+ createFarmerProfile()", "+ getFarmerProfile()"], 4.4),
            ("FarmService", [], ["+ getFarm()", "+ saveFarm()"], 3.6),
            ("FarmMemoryService", [], ["+ getFarmMemory()", "+ addFarmMemoryEntry()", "+ completeFarmLesson()", "+ deleteFarmMemoryEntry()"], 5.0),
            ("LessonService", [], ["+ getPublishedLessons()"], 4.2),
            ("CommunityObservation\nService", [], ["+ getCommunityMapData()", "+ addCommunityObservation()", "+ reportCommunityObservation()", "+ deleteCommunityObservation()"], 5.6),
        ]),
        ("CLIENT: advice rules, validation and calls to the Worker", [
            ("WeatherAdviceEngine", ["- thresholds : KnowledgeBase"], ["+ getWeatherAdvice()", "+ getPrimaryWeatherAlert()", "+ isWeatherAlertImminent()"], 5.4),
            ("KnowledgeBase", ["+ WEATHER_RISK_THRESHOLDS", "+ CROPS, LIVESTOCK"], [], 4.6),
            ("Validation", [], ["+ validateLogin()", "+ validateRegister()", "+ validateFarm()"], 4.0),
            ("WeatherService\n(client)", [], ["+ getFarmWeatherForecast()", "+ getRegionalTemperatureGrid()"], 5.2),
            ("Vision and Speech\n(client)", [], ["+ identifyFarmImage()", "+ synthesizeWarning()"], 4.4),
            ("WorkerApi", [], ["+ requestWorker<T>()"], 3.4),
        ]),
        ("WORKER: Hono API (every route under /api)", [
            ("FirebaseAuth\nMiddleware", [], ["+ requireFirebaseAuth()"], 4.2),
            ("WeatherRoutes", [], ["+ GET /forecast", "+ GET /temperature-grid"], 4.6),
            ("VisionRoutes", [], ["+ POST /vision/identify"], 4.6),
            ("SpeechRoutes", [], ["+ POST /speech/synthesize"], 4.6),
            ("ApiResponse", [], ["+ ok(c, data, message)", "+ fail(c, message, status)"], 4.6),
        ]),
        ("WORKER: services", [
            ("FirestoreRest", [], ["+ getDocument()", "+ queryDocuments()", "+ createDocument()", "+ updateDocument()"], 4.4),
            ("WeatherService\n(worker)", [], ["+ getFarmWeatherForecast()"], 4.6),
            ("RegionalWeather\nService", [], ["+ getRegionalTemperatureGrid()"], 4.8),
            ("VisionService", [], ["+ identifyFarmImage()"], 4.2),
            ("SpeechService", [], ["+ synthesizeSpeech()"], 4.2),
        ]),
    ]
    gap, title_h = 1.0, 0.9
    total = sum(title_h + max(height(o, a) for _, a, o, _ in r) + gap for _, r in rows) + 3.2
    fig, ax = canvas(14.5, 14.5 * total / 31, 31, total)
    y = total - 0.3
    pos = {}
    for title, items in rows:
        ax.text(0.3, y - 0.3, title, fontsize=8.5, weight="bold", color=DARK)
        y -= title_h
        x = 0.3
        tallest = 0
        for name, attrs, ops, w in items:
            uml_class(ax, x, y, w, name, attrs, ops)
            pos[name] = (x, y, w, height(ops, attrs))
            tallest = max(tallest, height(ops, attrs))
            x += w + 0.45
        y -= tallest + gap
    def mid_right(n):
        x_, y_, w_, h_ = pos[n]
        return (x_ + w_, y_ - 0.4)
    def mid_left(n):
        x_, y_, w_, h_ = pos[n]
        return (x_, y_ - 0.4)
    arrow(ax, mid_right("WeatherAdviceEngine"), mid_left("KnowledgeBase"), "reads", ls="--", off=(0, 0.3))
    arrow(ax, mid_right("Vision and Speech\n(client)"), mid_left("WorkerApi"), "calls", off=(0, 0.3))
    ws = pos["WeatherService\n(client)"]
    wa = pos["WorkerApi"]
    arrow(ax, (ws[0] + 2.6, ws[1] - ws[3]), (wa[0] + 1.7, wa[1] - wa[3]), "calls", off=(0, -0.5), rad=0.35)
    ax.text(0.3, 2.9, "How the layers connect: client services call Firestore through the Firebase SDK. WeatherService, Vision and Speech (client) call the Worker through WorkerApi,\n"
                      "which sends the Firebase ID token. In the Worker, FirebaseAuthMiddleware protects every route, the route handlers call the worker services, FirestoreRest reads\n"
                      "the farm with the user's own token, and every handler answers through ApiResponse as { success, data, message }.\n"
                      "Data classes (Farm, FarmMemoryEntry, VideoLesson, CommunityObservation, CommunityReport) are shown in the data model.",
            fontsize=6.8, style="italic", va="top")
    save(fig, path)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    deployment(os.path.join(OUT, "deployment-diagram.png"))
    activity_report(os.path.join(OUT, "activity-report.png"))
    sequence_report(os.path.join(OUT, "sequence-report.png"))
    application_classes(os.path.join(OUT, "class-application.png"))

