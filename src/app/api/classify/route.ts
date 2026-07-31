import { NextRequest, NextResponse } from "next/server";
import { chatJson, GROQ_MODEL_FAST, withRetry } from "@/lib/groq";

export const runtime = "nodejs";

type ClassifyResult = {
  sentiment: string;
  categoriesMentioned: string[];
  blockerType: string;
  discoveryMode: string;
  userSegmentSignals: string[];
  isExplorationRelated: boolean;
  summary: string;
  mode: "groq" | "heuristic";
};

function heuristic(text: string): ClassifyResult {
  const t = text.toLowerCase();
  let blockerType = "none";
  if (/same|reorder|habit/.test(t)) blockerType = "habit_autopilot";
  else if (/search|browse/.test(t)) blockerType = "search_tunnel";
  else if (/quality|fresh|expire|trust/.test(t)) blockerType = "trust_quality";
  else if (/price|expensive/.test(t)) blockerType = "price_uncertainty";
  else if (/first|risk|try/.test(t)) blockerType = "first_purchase_risk";
  else if (/rush|minute|urgent/.test(t)) blockerType = "time_pressure";

  return {
    sentiment: /bad|worst|scam/.test(t)
      ? "negative"
      : /love|great|good/.test(t)
        ? "positive"
        : "neutral",
    categoriesMentioned: [
      ...(/pet|dog|cat/.test(t) ? ["pet supplies"] : []),
      ...(/baby|diaper/.test(t) ? ["baby products"] : []),
      ...(/snack|chips/.test(t) ? ["snacks"] : []),
      ...(/grocery|veg|milk/.test(t) ? ["groceries"] : []),
      ...(/shampoo|soap|care/.test(t) ? ["personal care"] : []),
    ],
    blockerType,
    discoveryMode: /reorder/.test(t) ? "reorder" : /search/.test(t) ? "search" : "unknown",
    userSegmentSignals: [
      ...(/pet|dog|cat/.test(t) ? ["pet_owner"] : []),
      ...(/baby|diaper/.test(t) ? ["new_parent"] : []),
      ...(/family|kids/.test(t) ? ["family_household"] : []),
    ],
    isExplorationRelated:
      /new|try|explore|category|never|habit|reorder|search/.test(t),
    summary: text.slice(0, 120),
    mode: "heuristic",
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(heuristic(text));
  }

  try {
    const result = await withRetry(() =>
      chatJson<Omit<ClassifyResult, "mode">>(
        `Classify Instamart/quick-commerce feedback. Return JSON with keys:
sentiment, categoriesMentioned, blockerType (habit_autopilot|search_tunnel|trust_quality|price_uncertainty|assortment_gap|discovery_ui|first_purchase_risk|time_pressure|none|other),
discoveryMode, userSegmentSignals, isExplorationRelated, summary.`,
        text.slice(0, 1500),
        { model: GROQ_MODEL_FAST, temperature: 0.1 }
      )
    );
    return NextResponse.json({ ...result, mode: "groq" satisfies "groq" });
  } catch (e) {
    return NextResponse.json({
      ...heuristic(text),
      fallbackError: (e as Error).message,
    });
  }
}
