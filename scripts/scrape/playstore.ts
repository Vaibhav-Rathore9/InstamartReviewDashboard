import gplay from "google-play-scraper";
import { join } from "path";
import {
  RAW,
  ensureDir,
  makeId,
  writeJsonl,
  sleep,
} from "../../src/lib/io";
import type { RawFeedbackItem } from "../../src/lib/types";

const g = (gplay as unknown as { default?: typeof gplay }).default ?? gplay;

const APPS = [
  { id: "in.swiggy.android.instamart", name: "instamart" },
  { id: "in.swiggy.android", name: "swiggy" },
  { id: "com.grofers.customerapp", name: "blinkit" },
  { id: "com.zeptoconsumerapp", name: "zepto" },
  { id: "com.bigbasket.mobileapp", name: "bigbasket" },
];

const SORTS = [
  { key: "newest", value: g.sort.NEWEST },
  { key: "rating", value: g.sort.RATING },
  { key: "helpfulness", value: g.sort.HELPFULNESS },
];

async function fetchAppReviews(appId: string, appName: string) {
  const items: RawFeedbackItem[] = [];
  for (const sort of SORTS) {
    let token: string | undefined;
    for (let page = 0; page < 5; page++) {
      try {
        const res = await g.reviews({
          appId,
          lang: "en",
          country: "in",
          sort: sort.value,
          num: 200,
          paginate: true,
          nextPaginationToken: token,
        });
        for (const r of res.data ?? []) {
          const text = (r.text || "").trim();
          if (!text) continue;
          items.push({
            id: makeId("playstore", appName, text, String(r.id ?? "")),
            source: "playstore",
            app: appName,
            author: r.userName,
            rating: r.score,
            title: r.title,
            text,
            date: r.date ? new Date(r.date).toISOString() : undefined,
            url: `https://play.google.com/store/apps/details?id=${appId}`,
            metadata: { sort: sort.key, thumbsUp: r.thumbsUp },
          });
        }
        token = res.nextPaginationToken;
        if (!token) break;
        await sleep(800);
      } catch (err) {
        console.warn(`Play Store fail ${appName}/${sort.key} page ${page}:`, (err as Error).message);
        break;
      }
    }
  }
  return items;
}

async function main() {
  ensureDir(RAW);
  const all: RawFeedbackItem[] = [];
  for (const app of APPS) {
    console.log(`Scraping Play Store: ${app.name}...`);
    const items = await fetchAppReviews(app.id, app.name);
    console.log(`  → ${items.length} reviews`);
    writeJsonl(join(RAW, `playstore_${app.name}.jsonl`), items);
    all.push(...items);
  }
  writeJsonl(join(RAW, "playstore_all.jsonl"), all);
  console.log(`Play Store total: ${all.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
