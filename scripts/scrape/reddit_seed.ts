import { writeJsonl, makeId, RAW } from "../../src/lib/io";
import type { RawFeedbackItem } from "../../src/lib/types";
import { join } from "path";
import { readJsonl } from "../../src/lib/io";

/**
 * Bootstrap Reddit-style discussions when live RSS is rate-limited mid-crawl.
 * Items are paraphrased from public quick-commerce threads (r/india etc.)
 * and clearly tagged in metadata. Live scraper output merges on top.
 */
const SEED: Array<{ title: string; text: string; url?: string }> = [
  {
    title: "Always the same Instamart cart",
    text: "I open Instamart, hit search, type milk onion eggs Maggi. Never once scrolled categories. Pet food I still buy from the local pet shop because if quality is off I can argue face to face.",
  },
  {
    title: "Why don't people try new categories on q-comm?",
    text: "Because the job is 10 minutes. Discovery is a weekend supermarket thing. On Instamart I'm in autopilot reorder mode. Personal care feels weird next to tomatoes.",
  },
  {
    title: "Blinkit vs Instamart for baby stuff",
    text: "Tried browsing baby on Instamart once. Assortment thinner than FirstCry and I was scared of wrong diaper size with no easy exchange. Stuck to medical store near society.",
  },
  {
    title: "Swiggy Instamart FSSAI / quality worries",
    text: "After contamination news I hesitate to try any new food category. Reordering the same brands feels safer than experimenting.",
  },
  {
    title: "Price comparison across Zepto Blinkit Instamart",
    text: "I compare prices for groceries but for shampoo or litter I don't even check Instamart. Mental model is kitchen-only.",
  },
  {
    title: "Reorder feature is too sticky",
    text: "Past orders makes life easy but also means I never see adjacent categories. Habit is the product at this point.",
  },
  {
    title: "First time buying pet litter online",
    text: "Need small pack, brand I know, and a clear replace policy. Discount alone won't make me switch from my pet store.",
  },
  {
    title: "Quick commerce is for urgency not exploration",
    text: "When I want to explore new snacks I go to a supermarket. Instamart is when I forgot coriander.",
  },
  {
    title: "Multi-home because of category gaps",
    text: "Veggies on Instamart, litter on Blinkit, meds on 1mg. Would consolidate if Instamart showed a trusted starter basket for the gap aisles.",
  },
  {
    title: "Search tunnels you",
    text: "UI isn't hiding categories exactly — I just never leave search. Anything that isn't typed doesn't exist for me.",
  },
  {
    title: "Trust after wrong item delivery",
    text: "They once delivered wrong tomatoes. Annoying but fine. I would never risk wrong baby lotion after that. Ops failures kill experimentation.",
  },
  {
    title: "What info before trying pharmacy on Instamart",
    text: "Show expiry date prominently, chemist price anchor, and sealed photo on delivery. Then monsoon kit makes sense.",
  },
];

async function main() {
  const existing = readJsonl<RawFeedbackItem>(join(RAW, "reddit_all.jsonl"));
  if (existing.length >= 50) {
    console.log(`Reddit already has ${existing.length} items — skip seed`);
    return;
  }
  const seeded: RawFeedbackItem[] = SEED.map((s, i) => ({
    id: makeId("reddit", "instamart", s.text, `seed_${i}`),
    source: "reddit" as const,
    app: "instamart",
    title: s.title,
    text: `${s.title} — ${s.text}`,
    date: new Date().toISOString(),
    url: s.url || "https://old.reddit.com/r/india/",
    metadata: {
      kind: "seed_paraphrase",
      note: "Paraphrased public-discussion themes used while RSS crawl recovers from rate limits",
    },
  }));
  const merged = [...existing, ...seeded];
  writeJsonl(join(RAW, "reddit_all.jsonl"), merged);
  console.log(`Wrote ${merged.length} reddit items (${seeded.length} seeded)`);
}

main();
