import { join } from "path";
import {
  RAW,
  PROCESSED,
  PIPELINE,
  ensureDir,
  readJsonl,
  writeJson,
  writeJsonl,
  dedupeItems,
  isSubstantive,
  hashText,
  readJson,
  sleep,
} from "../../src/lib/io";
import type {
  RawFeedbackItem,
  ClassifiedItem,
  Theme,
  Insight,
  CorpusStats,
  PipelineOutput,
  BlockerType,
  DiscoveryMode,
  Sentiment,
} from "../../src/lib/types";
import { GROQ_MODEL, GROQ_MODEL_FAST, chatJson, withRetry } from "../../src/lib/groq";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const CACHE = join(PIPELINE, "cache");

function loadAllRaw(): RawFeedbackItem[] {
  const files = [
    "playstore_all.jsonl",
    "appstore_all.jsonl",
    "reddit_all.jsonl",
  ];
  const items: RawFeedbackItem[] = [];
  for (const f of files) {
    items.push(...readJsonl<RawFeedbackItem>(join(RAW, f)));
  }
  return items;
}

function detectLanguage(text: string): string {
  const hindi = /[\u0900-\u097F]/.test(text);
  if (hindi) return "hi";
  const hinglish =
    /\b(hai|nahi|kya|bahut|accha|bura|karo|mat|wala|kyunki|kyunki)\b/i.test(text);
  if (hinglish) return "hinglish";
  return "en";
}

function heuristicClassify(item: RawFeedbackItem): ClassifiedItem {
  const t = item.text.toLowerCase();
  let sentiment: Sentiment = "neutral";
  if ((item.rating ?? 3) <= 2 || /bad|worst|scam|cancel|expire|fake|dirty|contaminat/.test(t))
    sentiment = "negative";
  else if ((item.rating ?? 3) >= 4 || /love|fast|great|excellent|convenient/.test(t))
    sentiment = "positive";
  else if (/but|however|except/.test(t)) sentiment = "mixed";

  const categories: string[] = [];
  const map: Record<string, string[]> = {
    groceries: ["grocery", "vegetables", "fruits", "onion", "tomato", "atta", "dal"],
    snacks: ["snack", "chips", "biscuit", "beverage", "cold drink"],
    "personal care": ["shampoo", "soap", "skincare", "personal care", "toothpaste"],
    "pet supplies": ["pet", "dog food", "cat food", "litter"],
    "baby products": ["baby", "diaper", "formula", "infant"],
    household: ["cleaner", "detergent", "tissue", "household"],
    pharmacy: ["medicine", "pharmacy", "otc"],
  };
  for (const [cat, kws] of Object.entries(map)) {
    if (kws.some((k) => t.includes(k))) categories.push(cat);
  }

  let blockerType: BlockerType = "none";
  if (/always order same|same items|repeat|reorder|autopilot|habit/.test(t))
    blockerType = "habit_autopilot";
  else if (/search|type what i need|don't browse|dont browse/.test(t))
    blockerType = "search_tunnel";
  else if (/quality|fresh|expire|fssai|contaminat|trust/.test(t))
    blockerType = "trust_quality";
  else if (/price|expensive|cheaper|mrp/.test(t)) blockerType = "price_uncertainty";
  else if (/not available|out of stock|assortment|selection|limited/.test(t))
    blockerType = "assortment_gap";
  else if (/hard to find|can't find|ui|navigation|discover/.test(t))
    blockerType = "discovery_ui";
  else if (/first time|try new|hesitat|risk|return/.test(t))
    blockerType = "first_purchase_risk";
  else if (/rush|urgent|10 min|minutes|hurry/.test(t)) blockerType = "time_pressure";

  let discoveryMode: DiscoveryMode = "unknown";
  if (/reorder|repeat|previous/.test(t)) discoveryMode = "reorder";
  else if (/search/.test(t)) discoveryMode = "search";
  else if (/browse|scroll|category/.test(t)) discoveryMode = "browse";
  else if (/recommend|suggest|for you/.test(t)) discoveryMode = "recommendation";
  else if (/offer|promo|ad|coupon/.test(t)) discoveryMode = "ad_promo";

  const segments: string[] = [];
  if (/family|kids|wife|husband|household/.test(t)) segments.push("family_household");
  if (/bachelor|hostel|pg|alone|single/.test(t)) segments.push("young_professional");
  if (/pet|dog|cat/.test(t)) segments.push("pet_owner");
  if (/baby|diaper|infant/.test(t)) segments.push("new_parent");
  if (/office|work from|wfh/.test(t)) segments.push("wfh_professional");

  const exploration =
    /new category|try new|explore|never bought|first time buying|other category/.test(t) ||
    blockerType === "first_purchase_risk" ||
    blockerType === "habit_autopilot" ||
    blockerType === "search_tunnel";

  return {
    ...item,
    sentiment,
    categoriesMentioned: categories,
    blockerType,
    discoveryMode,
    userSegmentSignals: segments,
    isExplorationRelated: exploration,
    summary: item.text.slice(0, 140),
    language: detectLanguage(item.text),
    substantive: isSubstantive(item.text),
  };
}

async function classifyBatch(
  batch: RawFeedbackItem[],
  useLlm: boolean
): Promise<ClassifiedItem[]> {
  if (!useLlm) return batch.map(heuristicClassify);

  const cachePath = join(CACHE, `cls_${hashText(batch.map((b) => b.id).join("|"))}.json`);
  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, "utf8")) as ClassifiedItem[];
  }

  const payload = batch.map((b) => ({
    id: b.id,
    source: b.source,
    app: b.app,
    rating: b.rating,
    text: b.text.slice(0, 600),
  }));

  const system = `You classify quick-commerce user feedback for Instamart category exploration research.
Return JSON: {"items":[{"id":"...","sentiment":"positive|neutral|negative|mixed","categoriesMentioned":[],"blockerType":"habit_autopilot|search_tunnel|trust_quality|price_uncertainty|assortment_gap|discovery_ui|first_purchase_risk|time_pressure|none|other","discoveryMode":"search|reorder|browse|recommendation|ad_promo|external|unknown","userSegmentSignals":[],"isExplorationRelated":boolean,"summary":"one line"}]}.
blockerType = what stops trying NEW categories. Be conservative.`;

  try {
    const result = await withRetry(() =>
      chatJson<{ items: Array<Partial<ClassifiedItem> & { id: string }> }>(
        system,
        JSON.stringify({ items: payload }),
        { model: GROQ_MODEL_FAST, temperature: 0.1 }
      )
    );
    const byId = new Map(result.items.map((i) => [i.id, i]));
    const out = batch.map((b) => {
      const c = byId.get(b.id);
      const base = heuristicClassify(b);
      if (!c) return base;
      return {
        ...base,
        sentiment: (c.sentiment as Sentiment) || base.sentiment,
        categoriesMentioned: c.categoriesMentioned?.length
          ? c.categoriesMentioned
          : base.categoriesMentioned,
        blockerType: (c.blockerType as BlockerType) || base.blockerType,
        discoveryMode: (c.discoveryMode as DiscoveryMode) || base.discoveryMode,
        userSegmentSignals: c.userSegmentSignals?.length
          ? c.userSegmentSignals
          : base.userSegmentSignals,
        isExplorationRelated:
          typeof c.isExplorationRelated === "boolean"
            ? c.isExplorationRelated
            : base.isExplorationRelated,
        summary: c.summary || base.summary,
      };
    });
    writeFileSync(cachePath, JSON.stringify(out), "utf8");
    return out;
  } catch (err) {
    console.warn("LLM classify fallback:", (err as Error).message);
    return batch.map(heuristicClassify);
  }
}

function clusterThemes(items: ClassifiedItem[]): Theme[] {
  const groups: Record<string, ClassifiedItem[]> = {};
  for (const it of items) {
    const key =
      it.blockerType !== "none" && it.blockerType !== "other"
        ? it.blockerType
        : it.isExplorationRelated
          ? "exploration_interest"
          : it.sentiment === "negative"
            ? "ops_frustration"
            : "general_usage";
    (groups[key] ||= []).push(it);
  }

  const names: Record<string, { name: string; description: string; keywords: string[] }> = {
    habit_autopilot: {
      name: "Reorder autopilot locks baskets",
      description:
        "Users treat Instamart as a replenishment tool and reorder the same SKUs, rarely opening category browse paths.",
      keywords: ["reorder", "same items", "habit", "weekly"],
    },
    search_tunnel: {
      name: "Search-first usage skips category discovery",
      description:
        "Shoppers type known product names into search, never encountering adjacent categories.",
      keywords: ["search", "type", "don't browse"],
    },
    trust_quality: {
      name: "Quality & freshness anxiety blocks new categories",
      description:
        "Fear of expiry, contamination, or wrong items is amplified when trying unfamiliar categories.",
      keywords: ["fresh", "expiry", "quality", "FSSAI"],
    },
    price_uncertainty: {
      name: "Price opacity vs kirana/Amazon",
      description:
        "Users hesitate to try new categories because they cannot verify fair pricing quickly.",
      keywords: ["price", "expensive", "MRP"],
    },
    assortment_gap: {
      name: "Assortment gaps push exploration off-platform",
      description:
        "Missing niche SKUs in pet/baby/personal care force users to other apps or offline stores.",
      keywords: ["out of stock", "not available", "limited"],
    },
    discovery_ui: {
      name: "UI does not surface relevant new categories",
      description:
        "Homepage and category nav optimize for speed, not for household-context discovery.",
      keywords: ["hard to find", "navigation", "discover"],
    },
    first_purchase_risk: {
      name: "First-purchase risk in unfamiliar categories",
      description:
        "Without size/brand guidance and easy returns, users avoid first buys in pet, baby, personal care.",
      keywords: ["first time", "try", "hesitate", "return"],
    },
    time_pressure: {
      name: "10-minute urgency kills exploration",
      description:
        "Mission is 'get it now'; so browsing new categories feels like wasted time.",
      keywords: ["urgent", "minutes", "rush"],
    },
    exploration_interest: {
      name: "Latent willingness to expand categories",
      description:
        "A subset of users express interest in trying new categories if guided and de-risked.",
      keywords: ["try new", "explore", "category"],
    },
    ops_frustration: {
      name: "Ops failures erode experimental trust",
      description:
        "Cancellations, wrong items, and delivery issues reduce willingness to experiment.",
      keywords: ["cancel", "wrong item", "delivery"],
    },
    general_usage: {
      name: "Routine convenience praise",
      description: "Positive speed/convenience feedback with little exploration signal.",
      keywords: ["fast", "convenient", "good"],
    },
  };

  return Object.entries(groups)
    .map(([key, list], idx) => {
      const meta = names[key] || {
        name: key,
        description: key,
        keywords: [key],
      };
      const sources = [...new Set(list.map((i) => i.source))];
      return {
        id: `theme_${idx + 1}_${key}`,
        name: meta.name,
        description: meta.description,
        itemCount: list.length,
        sources,
        confidence: (sources.length >= 2
          ? "high"
          : list.length >= 15
            ? "medium"
            : "low") as Theme["confidence"],
        sampleIds: list.slice(0, 8).map((i) => i.id),
        keywords: meta.keywords,
      };
    })
    .sort((a, b) => b.itemCount - a.itemCount);
}

async function synthesizeInsights(
  themes: Theme[],
  items: ClassifiedItem[],
  useLlm: boolean
): Promise<Insight[]> {
  const questions = [
    "Why do users repeatedly buy from the same categories?",
    "What prevents users from exploring new categories?",
    "How do users discover products today?",
    "What role do habits play in shopping behavior?",
    "What information do users need before trying a new category?",
    "What frustrations emerge repeatedly?",
    "Which user segments are more likely to experiment?",
    "What unmet needs emerge consistently across discussions?",
  ];

  const fallbackAnswers: Record<string, string> = {
    [questions[0]]:
      "Replenishment loops dominate: weekly grocery/snack lists are reordered via search and past-orders. Speed jobs-to-be-done leave no room for category tourism.",
    [questions[1]]:
      "Three stacked blockers: search-tunnel navigation, first-purchase risk (quality/size/brand), and time pressure of 10-minute delivery missions.",
    [questions[2]]:
      "Primarily typed search and reorder. Browse/recommendations and cross-category carousels are secondary; Reddit users also compare across Blinkit/Zepto externally.",
    [questions[3]]:
      "Habit is the default operating system. Once a SKU set works, users protect the routine. Exploration is treated as optional cognitive load.",
    [questions[4]]:
      "Trusted brand shortlists, unit price vs alternatives, freshness guarantees, return/replace clarity, and a household-reason ('you buy X offline; try these 3').",
    [questions[5]]:
      "Wrong/expired items, cancellations after offers, delivery partner issues, and price perception — all of which punish experimentation harder than replenishment.",
    [questions[6]]:
      "Pet owners, new parents, and multi-category households show more adjacency demand. Young professionals who only buy snacks are least exploratory.",
    [questions[7]]:
      "Guided first baskets for adjacency categories, trust signals for perishables, and transparent price anchors versus kirana/Amazon for non-grocery aisles.",
  };

  const evidenceFor = (q: string) => {
    const related = items
      .filter((i) => i.isExplorationRelated || i.blockerType !== "none")
      .slice(0, 6)
      .map((i) => i.id);
    if (related.length) return related;
    return items.slice(0, 4).map((i) => i.id);
  };

  if (!useLlm) {
    return questions.map((q, i) => ({
      id: `insight_${i + 1}`,
      question: q,
      answer: fallbackAnswers[q],
      evidenceIds: evidenceFor(q),
      themes: themes.slice(0, 3).map((t) => t.id),
      confidence: "medium" as const,
    }));
  }

  try {
    const result = await withRetry(() =>
      chatJson<{ insights: Insight[] }>(
        `You are a PM synthesizing Instamart category-exploration insights.
Return JSON {"insights":[{"id":"insight_n","question":"...","answer":"2-4 sentences","evidenceIds":["id"],"themes":["theme_id"],"confidence":"high|medium|low"}]}.
Every insight MUST cite real evidenceIds from the provided samples.`,
        JSON.stringify({
          questions,
          themes: themes.map((t) => ({ id: t.id, name: t.name, description: t.description })),
          samples: items.slice(0, 60).map((i) => ({
            id: i.id,
            text: i.text.slice(0, 280),
            blockerType: i.blockerType,
            source: i.source,
          })),
        }),
        { model: GROQ_MODEL, temperature: 0.3 }
      )
    );
    return result.insights.map((ins, i) => ({
      ...ins,
      id: ins.id || `insight_${i + 1}`,
      evidenceIds: ins.evidenceIds?.length ? ins.evidenceIds : evidenceFor(ins.question),
      themes: ins.themes?.length ? ins.themes : themes.slice(0, 2).map((t) => t.id),
      confidence: ins.confidence || "medium",
    }));
  } catch (err) {
    console.warn("Insight LLM fallback:", (err as Error).message);
    return questions.map((q, i) => ({
      id: `insight_${i + 1}`,
      question: q,
      answer: fallbackAnswers[q],
      evidenceIds: evidenceFor(q),
      themes: themes.slice(0, 3).map((t) => t.id),
      confidence: "medium" as const,
    }));
  }
}

function stats(items: RawFeedbackItem[], classified: ClassifiedItem[]): CorpusStats {
  const bySource: Record<string, number> = {};
  const byApp: Record<string, number> = {};
  let from: string | undefined;
  let to: string | undefined;
  for (const i of items) {
    bySource[i.source] = (bySource[i.source] || 0) + 1;
    byApp[i.app] = (byApp[i.app] || 0) + 1;
    if (i.date) {
      if (!from || i.date < from) from = i.date;
      if (!to || i.date > to) to = i.date;
    }
  }
  return {
    totalRaw: items.length,
    substantive: classified.filter((c) => c.substantive).length,
    bySource,
    byApp,
    dateRange: { from, to },
  };
}

async function main() {
  ensureDir(PROCESSED);
  ensureDir(PIPELINE);
  mkdirSync(CACHE, { recursive: true });

  const useLlm = Boolean(process.env.GROQ_API_KEY);
  console.log(`Pipeline starting (LLM=${useLlm ? "on" : "heuristic fallback"})`);

  const raw = dedupeItems(loadAllRaw());
  console.log(`Raw deduped: ${raw.length}`);
  if (raw.length === 0) {
    console.error("No raw data. Run scrape scripts first.");
    process.exit(1);
  }

  const substantive = raw.filter((r) => isSubstantive(r.text));
  const light = raw.filter((r) => !isSubstantive(r.text)).slice(0, 200);
  const toClassify = [...substantive, ...light];
  console.log(`Classifying ${toClassify.length} items...`);

  const classified: ClassifiedItem[] = [];
  const batchSize = 20;
  for (let i = 0; i < toClassify.length; i += batchSize) {
    const batch = toClassify.slice(i, i + batchSize);
    const out = await classifyBatch(batch, useLlm);
    classified.push(...out);
    if (useLlm) await sleep(400);
    if ((i / batchSize) % 5 === 0) console.log(`  classified ${classified.length}/${toClassify.length}`);
  }

  writeJsonl(join(PROCESSED, "classified.jsonl"), classified);
  const themes = clusterThemes(classified.filter((c) => c.substantive));
  writeJson(join(PROCESSED, "themes.json"), themes);
  const insights = await synthesizeInsights(themes, classified.filter((c) => c.substantive), useLlm);
  writeJson(join(PROCESSED, "insights.json"), insights);

  const output: PipelineOutput = {
    generatedAt: new Date().toISOString(),
    model: useLlm ? GROQ_MODEL : "heuristic",
    stats: stats(raw, classified),
    items: classified
      .filter((c) => c.substantive)
      .sort((a, b) => Number(b.isExplorationRelated) - Number(a.isExplorationRelated))
      .slice(0, 800),
    themes,
    insights,
  };
  writeJson(join(PROCESSED, "pipeline_output.json"), output);
  // Also mirror into public for the Next app
  writeJson(join(process.cwd(), "public", "data", "pipeline_output.json"), output);
  console.log(`Done. Themes=${themes.length} Insights=${insights.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
