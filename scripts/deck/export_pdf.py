#!/usr/bin/env python3
"""Export a simple multi-page PDF of the deck if LibreOffice is unavailable."""
from pathlib import Path

try:
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import Color, HexColor
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "-q"])
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor

SLIDES = [
    (
        "MACs buy from the same aisles every month — habit, not awareness, is the growth leak",
        [
            "Swiggy Instamart · Growth PM case",
            "AI discovery engine + validated research + deployed Basket-Gap Agent",
        ],
    ),
    (
        "North-star: raise % of MACs who buy ≥1 new category each month",
        [
            "Examples: groceries → pet · snacks → personal care · household → baby",
            "Behavior today is replenishment-first: same search queries, same SKUs",
            "Winning unlocks adjacency without breaking the 10-minute job",
        ],
    ),
    (
        "AI engine: reorder habit + search tunnel + first-buy risk dominate",
        [
            "Corpus: Play Store + App Store + Reddit (10k+ items scraped)",
            "Themes: habit autopilot, search-first nav, quality anxiety, time pressure",
            "Discovery today = typed search & past orders, not category browse",
            "Every insight carries quote IDs; scorecard on /workflow",
        ],
    ),
    (
        "How the review-analysis workflow works (testable live)",
        [
            "1 Ingest → Play/App/Reddit scrapers to JSONL",
            "2 Normalize → dedupe, language, substance filter",
            "3 Classify → Groq gpt-oss blockers & segments",
            "4 Theme → cluster with evidence IDs",
            "5 Validate → gold set, kappa, triangulation, citations",
            "Live link: /workflow",
        ],
    ),
    (
        "6 interviews validate habit & risk — and challenge “price is #1”",
        [
            "Segment: replenishment users who buy pet/baby/care/pharmacy elsewhere",
            "Validated: autopilot, search tunnel, first-purchase risk",
            "Challenged: price as primary adjacency blocker; trust/size/replace win",
            "Artefact: /research/research-pack.md",
        ],
    ),
    (
        "Problem: first buys in new categories feel costly under a kitchen-only habit loop",
        [
            "Root cause: search-led habits + first-purchase risk + mental model silo",
            "Workarounds: Blinkit/Zepto, chemist, pet store, supermarket care aisle",
            "User value: fewer app/store switches with trusted starter baskets",
            "Business value: ↑ new-category MAC rate, AOV, retention",
        ],
    ),
    (
        "MVP: Basket-Gap Agent — trigger-timed, de-risked 3-SKU first baskets",
        [
            "Infer household from reorder graph",
            "Detect categories bought elsewhere",
            "3 SKUs with reason + price anchor + risk reversal",
            "Time to a trigger — not a generic carousel",
        ],
    ),
    (
        "Production MVP: pick a persona, see the gap, chat the agent, add a trial SKU",
        [
            "Personas: Pet parent · Snack repeater · Family/toddler · WFH cook",
            "Instamart-styled mobile UI + Groq chat with cache fallback",
            "Live link: /agent",
        ],
    ),
    (
        "Success metric: new-category MAC rate — leading indicators on trial & repeat",
        [
            "Primary: % MACs with ≥1 new-to-them category in 30 days",
            "Leading: shortlist CTR · ATC · first-order completion",
            "Guardrail: replenishment conversion & ETA satisfaction",
            "Rollout: pet + baby cohorts first",
        ],
    ),
    (
        "Deliverables: workflow, research pack, and deployed agent",
        [
            "Workflow: /workflow",
            "Agent MVP: /agent",
            "Research pack: /research/research-pack.md",
            "Stack: Next.js · Groq openai/gpt-oss-120b · Vercel",
        ],
    ),
]


def main():
    out = Path(__file__).resolve().parents[2] / "deliverables" / "NL Swiggy Instamart.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    page = landscape(A4)
    c = canvas.Canvas(str(out), pagesize=page)
    w, h = page
    navy = HexColor("#1A1A2E")
    orange = HexColor("#FC8019")
    slate = HexColor("#334155")
    for title, bullets in SLIDES:
        c.setFillColor(HexColor("#F8FAFC"))
        c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setFillColor(orange)
        c.rect(0, h - 12, w, 12, fill=1, stroke=0)
        c.setFillColor(navy)
        c.setFont("Helvetica-Bold", 18)
        # wrap title
        y = h - 60
        words = title.split()
        line = ""
        for word in words:
            trial = (line + " " + word).strip()
            if c.stringWidth(trial, "Helvetica-Bold", 18) < w - 80:
                line = trial
            else:
                c.drawString(40, y, line)
                y -= 24
                line = word
        if line:
            c.drawString(40, y, line)
            y -= 36
        c.setFillColor(slate)
        c.setFont("Helvetica", 14)
        for b in bullets:
            c.drawString(50, y, "•  " + b)
            y -= 26
        c.showPage()
    c.save()
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
