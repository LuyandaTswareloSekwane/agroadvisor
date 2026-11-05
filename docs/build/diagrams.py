"""Draws the Phase 2 and Phase 3 diagrams with matplotlib (no external diagram tools needed)."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon, FancyArrowPatch

DARK = "#1F4D2B"
LIGHT = "#EAF3E6"
SAND = "#FFF6DD"
BROWN = "#8A6D1F"
GREY = "#555555"


def canvas(w, h, xlim, ylim):
    fig, ax = plt.subplots(figsize=(w, h), dpi=200)
    ax.set_xlim(0, xlim)
    ax.set_ylim(0, ylim)
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def box(ax, x, y, w, h, text, fc=LIGHT, ec=DARK, size=8, bold=False, round_=True):
    """x, y is the centre of the box."""
    patch = FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.02,rounding_size=0.15" if round_ else "square,pad=0",
                           fc=fc, ec=ec, lw=1.2)
    ax.add_patch(patch)
    ax.text(x, y, text, ha="center", va="center", fontsize=size, weight="bold" if bold else "normal")


def arrow(ax, p1, p2, label=None, color=GREY, style="-|>", ls="-", size=7, off=(0, 0.12), both=False, rad=0.0):
    a = FancyArrowPatch(p1, p2, arrowstyle="<|-|>" if both else style, mutation_scale=9, color=color, lw=1,
                        linestyle=ls, connectionstyle=f"arc3,rad={rad}")
    ax.add_patch(a)
    if label:
        ax.text((p1[0] + p2[0]) / 2 + off[0], (p1[1] + p2[1]) / 2 + off[1], label, ha="center", va="center", fontsize=size,
                color="black", bbox=dict(fc="white", ec="none", pad=0.6, alpha=0.9))


def save(fig, path):
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


# ------------------------------------------------------------------ context diagram
def context(path):
    fig, ax = canvas(10, 7.2, 20, 14)
    ax.add_patch(Circle((10, 7), 2.9, fc=LIGHT, ec=DARK, lw=2))
    ax.text(10, 7.35, "AgroAdvisor", ha="center", fontsize=13, weight="bold", color=DARK)
    ax.text(10, 6.45, "web application\nand API", ha="center", fontsize=9)
    ents = {
        "farmer": (2.2, 7, "Farmer"),
        "meteo": (10, 12.6, "Open-Meteo\nweather service"),
        "fb": (17.8, 10.5, "Firebase\nAuthentication\nand Firestore"),
        "ai": (17.8, 3.5, "Google Gemini\n(photo identification)"),
        "tts": (10, 1.4, "Azure Speech\n(spoken warnings)"),
        "yt": (2.6, 2.6, "YouTube\n(lesson videos)"),
        "osm": (2.6, 11.8, "OpenStreetMap\n(map tiles)"),
    }
    for k, (x, y, t) in ents.items():
        box(ax, x, y, 4.0, 1.9, t, fc=SAND if k != "farmer" else "#DCEBF7", ec=BROWN if k != "farmer" else "#2F5D8A", size=8.5, bold=(k == "farmer"))
    arrow(ax, (4.2, 7.5), (7.1, 7.3), "registration, farm details,\nnotes, photos", off=(0, 0.75))
    arrow(ax, (7.1, 6.5), (4.2, 6.5), "advice, warnings,\nlessons, map", off=(0, -0.75))
    arrow(ax, (10, 11.65), (10, 9.95), "forecast data", off=(1.3, 0))
    arrow(ax, (9.2, 9.95), (9.2, 11.65), "farm coordinates", off=(-1.5, 0))
    arrow(ax, (12.4, 8.6), (15.8, 10.2), "profiles, farm, notes,\nsign-in tokens", off=(1.4, 0.9), both=True)
    arrow(ax, (12.2, 5.4), (15.8, 3.9), "photo of crop\nor animal; result", off=(0.2, -0.8), both=True)
    arrow(ax, (10, 4.1), (10, 2.35), "warning text", off=(1.2, 0))
    arrow(ax, (5.0, 3.0), (7.6, 5.0), "video stream", off=(-0.5, -0.5))
    arrow(ax, (5.0, 11.3), (7.6, 9.2), "map tiles", off=(-0.6, 0.5))
    save(fig, path)


# ------------------------------------------------------------------ architecture
def architecture(path):
    fig, ax = canvas(10, 8.6, 20, 17)
    layers = [
        (14.2, "PRESENTATION LAYER  -  React + TypeScript + Tailwind (Cloudflare Pages)", "#DCEBF7"),
        (8.4, "APPLICATION LAYER  -  Hono API on a Cloudflare Worker", LIGHT),
        (2.6, "DATA AND EXTERNAL SERVICES LAYER", SAND),
    ]
    for y, t, fc in layers:
        ax.add_patch(Rectangle((0.5, y - 2.4), 19, 4.8, fc=fc, ec=DARK, lw=1.4))
        ax.text(10, y + 1.95, t, ha="center", fontsize=9, weight="bold", color=DARK)
    # presentation
    for i, t in enumerate(["Pages\n(Dashboard, Farm,\nLearn, Memory,\nCommunity, Login)", "Components and advice\nrules (weatherAdvice)\n(forms, map, cards)", "Services\n(auth, farm, memory,\nlessons, community,\nworker API)"]):
        box(ax, 3.7 + i * 6.3, 14.0, 5.0, 2.6, t, size=8)
    # application
    for i, t in enumerate(["Middleware\n(verify Firebase ID\ntoken with jose)", "Routes /api\n(weather, vision,\nspeech, health)", "Services\n(forecast, regional\ntemperature grid,\nvision, speech)"]):
        box(ax, 3.7 + i * 6.3, 8.2, 5.0, 2.6, t, size=8)
    # data
    for i, (t, fc) in enumerate([("Firebase Authentication\n(email, Google, Microsoft)", SAND), ("Cloud Firestore\n(farmers, farms, memory,\nlessons, community)\n+ Security Rules", SAND),
                                  ("Open-Meteo\nGemini\nAzure Speech", SAND), ("Knowledge base\n(config/knowledge-base:\nthresholds and rules)", LIGHT)]):
        box(ax, 2.7 + i * 4.8, 2.4, 4.3, 2.8, t, fc=fc, ec=BROWN, size=7.5)
    arrow(ax, (6.6, 12.1), (6.6, 10.6), "HTTPS + Bearer token", both=True, off=(2.0, 0))
    arrow(ax, (19.9, 14.0), (19.9, 3.0), None, color=DARK, both=True)
    ax.text(20.5, 8.5, "Direct client access to Firebase (Security Rules enforced)", fontsize=6.5, ha="center", va="center", rotation=90)
    arrow(ax, (9.6, 6.9), (7.5, 3.9), "REST + user token", off=(-1.6, 0.3))
    arrow(ax, (16.3, 6.9), (12.3, 3.9), "forecast, photo ID, speech", off=(2.6, 0.3))
    save(fig, path)


# ------------------------------------------------------------------ activity diagram
def activity(path):
    fig, ax = canvas(7, 11, 14, 22)
    cx = 5.5
    def node(y, text, w=7.2, h=1.1):
        box(ax, cx, y, w, h, text, size=8)
    def diamond(x, y, text):
        ax.add_patch(Polygon([(x, y + 1.0), (x + 2.2, y), (x, y - 1.0), (x - 2.2, y)], fc=SAND, ec=BROWN, lw=1.2))
        ax.text(x, y, text, ha="center", va="center", fontsize=7)
    ax.add_patch(Circle((cx, 21.2), 0.3, fc="black"))
    arrow(ax, (cx, 20.9), (cx, 20.35))
    node(19.8, "Farmer opens the Dashboard")
    arrow(ax, (cx, 19.25), (cx, 18.5))
    diamond(cx, 17.6, "Logged in?")
    arrow(ax, (cx - 2.2, 17.6), (1.3, 17.6)); ax.text(2.4, 17.9, "No", fontsize=7)
    box(ax, 1.3, 16.3, 2.4, 1.2, "Go to\nlogin page", size=7)
    arrow(ax, (1.3, 17.6), (1.3, 16.9), None)
    arrow(ax, (cx, 16.6), (cx, 15.8)); ax.text(cx + 0.2, 16.2, "Yes", fontsize=7)
    node(15.2, "Load farm profile from Firestore")
    arrow(ax, (cx, 14.65), (cx, 13.9))
    diamond(cx, 13.0, "Farm saved?")
    arrow(ax, (cx + 2.2, 13.0), (11.6, 13.0)); ax.text(cx + 3.0, 13.3, "No", fontsize=7)
    box(ax, 11.6, 11.7, 3.4, 1.4, "Ask the farmer to\ncomplete the farm\nprofile", size=7)
    arrow(ax, (11.6, 13.0), (11.6, 12.4), None)
    arrow(ax, (cx, 12.0), (cx, 11.2)); ax.text(cx + 0.2, 11.6, "Yes", fontsize=7)
    node(10.6, "Request forecast from the Worker\n(ID token in Authorization header)", h=1.3)
    arrow(ax, (cx, 9.95), (cx, 9.2))
    node(8.6, "Worker verifies the token and reads\nthe farm profile (user's own token)", h=1.3)
    arrow(ax, (cx, 7.95), (cx, 7.2))
    node(6.6, "Worker fetches 7-day forecast (Open-Meteo)")
    arrow(ax, (cx, 6.05), (cx, 5.3))
    node(4.7, "Client compares the forecast with knowledge-\nbase thresholds for the farm's crops and animals", h=1.3)
    arrow(ax, (cx, 4.05), (cx, 3.3))
    diamond(cx, 2.4, "Risk found?")
    arrow(ax, (cx - 2.2, 2.4), (1.6, 2.4)); ax.text(2.4, 2.7, "No", fontsize=7)
    box(ax, 1.6, 0.9, 2.8, 1.2, "Show plain\nadvice only", size=7)
    arrow(ax, (1.6, 2.4), (1.6, 1.5), None)
    arrow(ax, (cx + 2.2, 2.4), (9.4, 2.4)); ax.text(cx + 3.0, 2.7, "Yes", fontsize=7)
    box(ax, 9.4, 0.9, 4.0, 1.2, "Show warning with what to do,\nwhen and why; offer audio", size=7)
    arrow(ax, (9.4, 2.4), (9.4, 1.5), None)
    save(fig, path)


# ------------------------------------------------------------------ state diagram
def state(path):
    fig, ax = canvas(9, 4.2, 18, 8.4)
    ax.add_patch(Circle((1.0, 5.6), 0.35, fc="black"))
    box(ax, 5.2, 5.6, 4.4, 2.2, "Visible\nreportCount = 0", size=9, bold=True)
    box(ax, 12.0, 5.6, 4.4, 2.2, "Visible\nreportCount = 1", size=9, bold=True)
    box(ax, 12.0, 1.4, 4.4, 1.8, "Hidden\nreportCount = 2", size=9, bold=True, fc="#F8E3E0", ec="#A03A2E")
    ax.add_patch(Circle((5.2, 1.4), 0.4, fc="white", ec="black", lw=1.5)); ax.add_patch(Circle((5.2, 1.4), 0.22, fc="black"))
    ax.text(5.2, 0.55, "Deleted", ha="center", fontsize=8)
    arrow(ax, (1.35, 5.6), (3.0, 5.6), "farmer adds note\n(within 25 km)", off=(0, 0.75))
    arrow(ax, (7.4, 5.9), (9.8, 5.9), "first report\nby another farmer", off=(0, 0.75))
    arrow(ax, (12.0, 4.5), (12.0, 2.3), "second report by a\ndifferent farmer", off=(1.7, 0))
    arrow(ax, (5.2, 4.5), (5.2, 1.85), "author removes note", off=(-1.6, 0))
    arrow(ax, (9.9, 4.5), (5.55, 1.6), "author removes note", off=(2.6, 0.2), rad=-0.15)
    ax.text(9.0, 7.7, "A farmer cannot report their own note or report the same note twice.\nHidden notes no longer appear on the map.",
            ha="center", fontsize=7.5, style="italic")
    save(fig, path)


# ------------------------------------------------------------------ class diagram
def uml_class(ax, x, y, w, name, attrs, ops=()):
    lh = 0.52
    h = 0.8 + lh * (len(attrs) + len(ops)) + (0.25 if ops else 0)
    ax.add_patch(Rectangle((x, y - h), w, h, fc="white", ec=DARK, lw=1.2))
    ax.add_patch(Rectangle((x, y - 0.75), w, 0.75, fc=LIGHT, ec=DARK, lw=1.2))
    ax.text(x + w / 2, y - 0.38, name, ha="center", va="center", fontsize=8.5, weight="bold")
    for i, a in enumerate(attrs):
        ax.text(x + 0.2, y - 0.75 - 0.4 - i * lh, a, fontsize=6.6, va="center")
    base = y - 0.75 - 0.25 - len(attrs) * lh
    if ops:
        ax.plot([x, x + w], [base, base], c=DARK, lw=0.8)
        for i, o in enumerate(ops):
            ax.text(x + 0.2, base - 0.35 - i * lh, o, fontsize=6.6, va="center")
    return (x, y, w, h)


def class_diagram(path):
    fig, ax = canvas(11, 9, 22, 18)
    f = uml_class(ax, 0.5, 17.5, 6.2, "FarmerProfile", ["+ uid : string", "+ fullName : string", "+ email : string", "+ createdAt : Timestamp"])
    fm = uml_class(ax, 8.2, 17.5, 6.6, "Farm", ["+ ownerId : string", "+ name : string", "+ locationName : string", "+ location : FarmLocation",
                                               "+ sizeHectares : number", "+ crops : string[]", "+ livestock : Map<string, number>", "+ photoDataUrl : string | null",
                                               "+ createdAt, updatedAt : Timestamp"])
    uml_class(ax, 16.3, 17.5, 5.2, "FarmLocation", ["+ latitude : number", "+ longitude : number"])
    me = uml_class(ax, 8.2, 6.3, 6.6, "FarmMemoryEntry", ["+ id : string", "+ type : weather | planting | success | lesson", "+ title : string", "+ note : string",
                                                        "+ occurredAt : Timestamp", "+ createdAt : Timestamp", "+ lessonId : string (lessons only)"])
    ls = uml_class(ax, 16.3, 11.0, 5.2, "VideoLesson", ["+ id : string", "+ topicId, topicLabel : string", "+ title : string", "+ youtubeId : string", "+ language : string",
                                                       "+ durationSeconds : number", "+ reviewed = true", "+ published = true", "+ summary : string", "+ keySteps : LessonStep[]"])
    ob = uml_class(ax, 0.5, 10.5, 6.6, "CommunityObservation", ["+ id : string", "+ type : flooding | frost | other", "+ details : string (max 240)", "+ location : FarmLocation",
                                                              "+ authorId : string", "+ status : visible | hidden", "+ reportCount : int (0-2)", "+ createdAt : Timestamp"],
                   ["+ report() / + remove()"])
    rp = uml_class(ax, 0.5, 3.0, 6.6, "CommunityReport", ["+ reporterId : string (path)", "+ observationId : string", "+ createdAt : Timestamp"])
    def link(pts, style="-"):
        ax.plot([p[0] for p in pts], [p[1] for p in pts], c=DARK, lw=1, ls=style)
    link([(6.7, 16.0), (8.2, 16.0)]); ax.text(6.8, 16.25, "1", fontsize=7); ax.text(7.7, 16.25, "1", fontsize=7)
    link([(14.8, 16.0), (16.3, 16.0)]); ax.text(14.9, 16.25, "1", fontsize=7); ax.text(15.9, 16.25, "1", fontsize=7)
    link([(11.5, 12.02), (11.5, 6.3)]); ax.text(11.7, 11.7, "1", fontsize=7); ax.text(11.7, 6.6, "0..*", fontsize=7); ax.text(11.7, 9.0, "has", fontsize=7)
    link([(14.8, 3.9), (17.4, 3.9), (17.4, 5.0)], "--"); ax.text(15.0, 4.15, "completes", fontsize=7)
    link([(3.5, 14.62), (3.5, 10.5)]); ax.text(3.7, 14.3, "1", fontsize=7); ax.text(3.7, 10.8, "0..*  writes", fontsize=7)
    link([(3.5, 4.77), (3.5, 3.0)]); ax.text(3.7, 4.5, "1", fontsize=7); ax.text(3.7, 3.25, "0..2  reported by", fontsize=7)
    save(fig, path)


# ------------------------------------------------------------------ sequence diagram
def sequence(path):
    fig, ax = canvas(11, 8.4, 22, 17)
    actors = [("Farmer", 1.6), ("React client", 5.6), ("Worker API", 10.2), ("Firestore", 14.6), ("Open-Meteo", 19.0)]
    for name, x in actors:
        box(ax, x, 16.0, 3.2, 1.0, name, size=8, bold=True)
        ax.plot([x, x], [15.4, 2.6], c="#999", lw=0.8, ls="--")
    steps = [
        (1.6, 5.6, 14.5, "open Dashboard"),
        (5.6, 14.6, 13.5, "read farm profile (SDK, rules apply)"),
        (14.6, 5.6, 12.6, "farm document"),
        (5.6, 10.2, 11.6, "GET /api/weather/forecast + Bearer token"),
        (10.2, 10.2, 10.6, "verify ID token (jose, Google keys)"),
        (10.2, 14.6, 9.6, "REST: read farm with user's token"),
        (14.6, 10.2, 8.6, "farm location, crops, livestock"),
        (10.2, 19.0, 7.6, "GET 7-day forecast"),
        (19.0, 10.2, 6.6, "daily weather data"),
        (10.2, 5.6, 5.6, "{success, data, message}"),
        (5.6, 5.6, 4.6, "apply knowledge-base rules"),
        (5.6, 1.6, 3.4, "advice, outlook and warnings"),
    ]
    for a, b, y, label in steps:
        if a == b:
            ax.add_patch(Rectangle((a, y - 0.35), 0.35, 0.7, fc=LIGHT, ec=DARK))
            ax.text(a + 0.6, y, label, fontsize=7, va="center")
            continue
        dashed = label in ("farm document", "farm location, crops, livestock", "daily weather data", "{success, data, message}", "advice, outlook and warnings")
        arrow(ax, (a, y), (b, y), None, ls="--" if dashed else "-", color="black")
        ax.text((a + b) / 2, y + 0.3, label, fontsize=7, ha="center")
    save(fig, path)


# ------------------------------------------------------------------ gantt
def gantt(path):
    tasks = [
        ("T1 Requirements and interview plan", 1, 3),
        ("T2 Design (UI, data, architecture)", 3, 3),
        ("T3 Authentication and farmer profile", 5, 3),
        ("T4 Weather advice and alerts", 7, 4),
        ("T5 Learn page and farm memory", 10, 3),
        ("T6 Community map and security rules", 12, 3),
        ("T7 Photo identification and speech", 14, 2),
        ("T8 Testing and fixes", 15, 3),
        ("T9 Documentation", 3, 16),
        ("T10 Deployment and final review", 18, 2),
    ]
    fig, ax = plt.subplots(figsize=(10, 4.6), dpi=200)
    for i, (name, start, dur) in enumerate(tasks):
        ax.barh(i, dur, left=start - 1, color=DARK if i != 8 else BROWN, height=0.55)
    ax.set_yticks(range(len(tasks)))
    ax.set_yticklabels([t[0] for t in tasks], fontsize=8)
    ax.invert_yaxis()
    ax.set_xticks(range(0, 21, 2))
    ax.set_xticklabels([f"W{n + 1}" for n in range(0, 21, 2)], fontsize=8)
    ax.set_xlim(0, 20)
    ax.grid(axis="x", ls=":", alpha=0.6)
    ax.set_xlabel("Project week (planned schedule: replace with calendar dates)", fontsize=8)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    save(fig, path)


# ------------------------------------------------------------------ entity relationship diagram
def erd(path):
    fig, ax = canvas(11, 8.8, 22, 16.4)
    ax.set_ylim(-1.2, 16.4)
    def ent(x, y, w, name, fields):
        h = 0.9 + 0.5 * len(fields)
        ax.add_patch(Rectangle((x, y - h), w, h, fc="white", ec=DARK, lw=1.2))
        ax.add_patch(Rectangle((x, y - 0.8), w, 0.8, fc=LIGHT, ec=DARK, lw=1.2))
        ax.text(x + w / 2, y - 0.4, name, ha="center", va="center", fontsize=8, weight="bold")
        for i, f in enumerate(fields):
            ax.text(x + 0.2, y - 0.8 - 0.4 - i * 0.5, f, fontsize=6.6, va="center")
        return h
    ent(0.4, 15.8, 6.4, "farmers  (doc: uid)", ["PK uid : string", "fullName : string", "email : string", "createdAt : timestamp"])
    ent(8.2, 15.8, 6.6, "farms  (doc: ownerId)", ["PK/FK ownerId : string  -> farmers.uid", "name : string", "locationName : string", "location : map(latitude, longitude)",
                                                 "sizeHectares : number", "crops : array<string>", "livestock : map<string, number>", "photoDataUrl : string | null",
                                                 "createdAt, updatedAt : timestamp"])
    ent(8.2, 6.0, 6.6, "farms/{uid}/memory", ["PK entryId : string (auto)", "FK uid : string  -> farms (parent path)", "type : string", "title : string", "note : string",
                                             "occurredAt : timestamp", "createdAt : timestamp", "lessonId : string  -> lessons.id (optional)"])
    ent(16.0, 6.0, 5.6, "lessons", ["PK lessonId : string", "topicId, topicLabel : string", "title : string", "youtubeId : string", "language : string", "durationSeconds : number",
                                   "reviewed, published : boolean", "visualOnly : boolean", "fallbackPriority : number", "summary : string", "keySteps : array<map>"])
    ent(0.4, 8.6, 6.8, "communityObservations", ["PK observationId : string (auto)", "FK authorId : string  -> farmers.uid", "type : string", "details : string", "location : map(latitude, longitude)",
                                                "status : string", "reportCount : number", "createdAt : timestamp"])
    ent(0.4, 2.4, 6.8, "communityReports/{reporterId}/reports", ["PK/FK reporterId : string -> farmers.uid", "PK/FK observationId : string", "     -> communityObservations", "createdAt : timestamp"])
    ax.plot([6.8, 8.2], [14.0, 14.0], c=DARK); ax.text(6.9, 14.2, "1", fontsize=7); ax.text(7.7, 14.2, "1", fontsize=7)
    ax.plot([11.5, 11.5], [10.4, 6.0], c=DARK); ax.text(11.7, 10.1, "1", fontsize=7); ax.text(11.7, 6.25, "0..*", fontsize=7)
    ax.plot([14.8, 16.0], [3.2, 3.2], c=DARK, ls="--"); ax.text(14.9, 3.4, "0..*", fontsize=7); ax.text(15.6, 3.4, "0..1", fontsize=7)
    ax.plot([3.6, 3.6], [12.9, 8.6], c=DARK); ax.text(3.8, 12.6, "1", fontsize=7); ax.text(3.8, 8.9, "0..*", fontsize=7)
    ax.plot([3.8, 3.8], [3.7, 2.4], c=DARK); ax.text(4.0, 3.45, "1", fontsize=7); ax.text(4.0, 2.65, "0..2", fontsize=7)
    save(fig, path)


# ------------------------------------------------------------------ use case diagram (12 use cases)
def use_case(path):
    from matplotlib.patches import Ellipse
    fig, ax = canvas(10, 10.4, 10, 12.4)
    ax.add_patch(Rectangle((2.3, 0.2), 4.9, 11.9, fill=False, lw=1.8, ec=DARK))
    ax.text(4.75, 11.75, "AgroAdvisor (web application)", ha="center", fontsize=11, weight="bold", color=DARK)
    cases = [
        ("UC1  Register and log in", "fb"), ("UC2  Manage farm profile", "fb"),
        ("UC3  View weather advice and\n7-day farm outlook", "om"), ("UC4  Receive and hear a\nsevere-weather warning", "om"),
        ("UC5  Watch a learning lesson", "yt"), ("UC6  Mark a lesson complete", "fb"),
        ("UC7  Record farm memory and\nview the weekly summary", "fb"), ("UC8  Add a local observation\non the community map", "osm"),
        ("UC9  Report or remove a\ncommunity note", "fb"), ("UC10 Change interface language", None),
        ("UC11 Identify a crop or animal\nfrom a photo", "ai"), ("UC12 Estimate plot size by\nwalking the boundary", None),
    ]
    ys = [10.9 - i * 0.92 for i in range(len(cases))]
    pos = []
    for (label, ext), y in zip(cases, ys):
        ax.add_patch(Ellipse((4.75, y), 3.9, 0.78, fc=LIGHT, ec=DARK, lw=1.2))
        ax.text(4.75, y, label, ha="center", va="center", fontsize=8)
        pos.append((y, ext))
    ax_x, ax_y = 0.9, 6.0
    ax.add_patch(Circle((ax_x, ax_y + 0.9), 0.22, fc="white", ec="black"))
    ax.plot([ax_x, ax_x], [ax_y + 0.68, ax_y - 0.2], c="black")
    ax.plot([ax_x - 0.4, ax_x + 0.4], [ax_y + 0.4, ax_y + 0.4], c="black")
    ax.plot([ax_x, ax_x - 0.35], [ax_y - 0.2, ax_y - 0.9], c="black")
    ax.plot([ax_x, ax_x + 0.35], [ax_y - 0.2, ax_y - 0.9], c="black")
    ax.text(ax_x, ax_y - 1.25, "Farmer", ha="center", fontsize=10, weight="bold")
    for y in ys:
        ax.plot([ax_x + 0.4, 2.8], [ax_y + 0.4, y], c="#555", lw=0.7)
    ext_boxes = {"fb": ("Firebase\n(Auth, Firestore)", 8.5, 9.3), "om": ("Open-Meteo\nweather service", 8.5, 7.1),
                 "yt": ("YouTube\n(embedded player)", 8.5, 5.3), "osm": ("OpenStreetMap\nmap tiles", 8.5, 3.7), "ai": ("Google Gemini\n(photo analysis)", 8.5, 2.1)}
    for key, (label, x, y) in ext_boxes.items():
        ax.add_patch(Rectangle((x - 0.85, y - 0.55), 1.7, 1.1, fc=SAND, ec=BROWN, lw=1.2))
        ax.text(x, y, "\u00abexternal system\u00bb\n" + label, ha="center", va="center", fontsize=6.5)
    for y, ext in pos:
        if ext:
            _, x, ey = ext_boxes[ext]
            ax.plot([6.7, x - 0.85], [y, ey], c=BROWN, lw=0.7, ls="--")
    ax.text(5, -0.35, "Solid lines: the farmer uses the function. Dashed lines: the function depends on an external system.\nUC2-UC12 require the farmer to be logged in (UC1).",
            ha="center", fontsize=7.5, style="italic")
    save(fig, path)


if __name__ == "__main__":
    out = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs\phase2"
    out3 = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs\phase3"
    context(os.path.join(out, "context-diagram.png"))
    architecture(os.path.join(out, "architecture-diagram.png"))
    activity(os.path.join(out, "activity-diagram.png"))
    state(os.path.join(out, "state-diagram.png"))
    class_diagram(os.path.join(out, "class-diagram.png"))
    sequence(os.path.join(out, "sequence-diagram.png"))
    gantt(os.path.join(out, "gantt-chart.png"))
    erd(os.path.join(out3, "erd.png"))
    use_case(os.path.join(out, "use-case-diagram.png"))
