import { NextRequest, NextResponse } from "next/server";
import { chatText, GROQ_MODEL_FAST, withRetry } from "@/lib/groq";
import { getPersona, shortlistForPersona } from "@/lib/personas";

export const runtime = "nodejs";

const CACHED: Record<string, string> = {
  why: "These 3 are chosen as a first-timer ladder: one familiar brand, one low-rupee trial, and one category-defining SKU — each with a price anchor and a replace promise so trying a new aisle doesn't feel like a gamble.",
  risk: "Risk reversal matters more than discounts for new categories. Sealed FMCG, small pack sizes, expiry checks on delivery, and one-tap replace remove the fear that stops pet/baby/personal-care first buys.",
  habit: "Your reorder graph shows a tight loop. Without a trigger-timed nudge, search keeps you inside known categories. The agent interrupts that loop only when a household signal says you already buy this elsewhere.",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const personaId = String(body.personaId || "riya_pet");
  const message = String(body.message || "").trim();
  const persona = getPersona(personaId);
  const shortlist = body.shortlist || shortlistForPersona(persona);

  if (!message) {
    return NextResponse.json({ reply: "Ask me anything about the shortlist." });
  }

  const lower = message.toLowerCase();
  if (!process.env.GROQ_API_KEY) {
    if (/risk|safe|return|replace/.test(lower))
      return NextResponse.json({ reply: CACHED.risk, mode: "cache" });
    if (/habit|always|same|reorder/.test(lower))
      return NextResponse.json({ reply: CACHED.habit, mode: "cache" });
    return NextResponse.json({
      reply: `${CACHED.why}\n\nFor ${persona.name}: gap=${persona.gapCategories.join(
        ", "
      )}. Top pick: ${shortlist[0]?.name} (₹${shortlist[0]?.price}) — ${shortlist[0]?.riskReversal}`,
      mode: "cache",
    });
  }

  try {
    const reply = await withRetry(() =>
      chatText(
        `You are Instamart's Basket-Gap Agent. Be concise (max 120 words), practical, and never invent SKUs not in the shortlist.
Explain household inference, why the gap exists, and how risk reversal helps. Tone: helpful PM, not salesy.`,
        JSON.stringify({
          persona: {
            name: persona.name,
            household: persona.household,
            gapCategories: persona.gapCategories,
            trigger: persona.trigger,
            recentOrders: persona.orders,
          },
          shortlist,
          userMessage: message,
        }),
        { model: GROQ_MODEL_FAST, temperature: 0.4 }
      )
    );
    return NextResponse.json({ reply, mode: "groq" });
  } catch (e) {
    return NextResponse.json({
      reply: CACHED.why,
      mode: "cache",
      error: (e as Error).message,
    });
  }
}
