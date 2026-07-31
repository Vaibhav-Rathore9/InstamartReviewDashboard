import { join } from "path";
import {
  RAW,
  ensureDir,
  makeId,
  writeJsonl,
  sleep,
} from "../../src/lib/io";
import type { RawFeedbackItem } from "../../src/lib/types";

const APPS = [
  { id: "6738619733", name: "instamart" },
  { id: "989540920", name: "swiggy" },
  { id: "960335206", name: "blinkit" },
  { id: "1571436325", name: "zepto" },
];

async function fetchPage(appId: string, page: number) {
  const url = `https://itunes.apple.com/in/rss/customerreviews/page=${page}/id=${appId}/sortBy=mostRecent/json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "InstamartDiscoveryEngine/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{
    feed?: { entry?: Array<Record<string, { label?: string }>> };
  }>;
}

async function fetchApp(appId: string, appName: string) {
  const items: RawFeedbackItem[] = [];
  for (let page = 1; page <= 10; page++) {
    try {
      const data = await fetchPage(appId, page);
      const entries = data.feed?.entry ?? [];
      // First entry can be app metadata on page 1
      for (const e of entries) {
        const text = e.content?.label?.trim() || e["im:content"]?.label?.trim() || "";
        const title = e.title?.label?.trim() || "";
        const rating = Number(e["im:rating"]?.label || 0) || undefined;
        const author = e.author?.name?.label;
        const date = e.updated?.label;
        const body = text || title;
        if (!body || body.length < 2) continue;
        // Skip app metadata entries that lack rating
        if (!rating && page === 1 && !text) continue;
        items.push({
          id: makeId("appstore", appName, body, e.id?.label || `${page}`),
          source: "appstore",
          app: appName,
          author,
          rating,
          title,
          text: body,
          date: date ? new Date(date).toISOString() : undefined,
          url: `https://apps.apple.com/in/app/id${appId}`,
          metadata: { page },
        });
      }
      await sleep(400);
    } catch (err) {
      console.warn(`App Store fail ${appName} page ${page}:`, (err as Error).message);
      break;
    }
  }
  return items;
}

async function main() {
  ensureDir(RAW);
  const all: RawFeedbackItem[] = [];
  for (const app of APPS) {
    console.log(`Scraping App Store: ${app.name}...`);
    const items = await fetchApp(app.id, app.name);
    console.log(`  → ${items.length} reviews`);
    writeJsonl(join(RAW, `appstore_${app.name}.jsonl`), items);
    all.push(...items);
  }
  writeJsonl(join(RAW, "appstore_all.jsonl"), all);
  console.log(`App Store total: ${all.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
