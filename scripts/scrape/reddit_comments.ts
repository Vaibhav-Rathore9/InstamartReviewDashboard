import { createHash } from "crypto";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { sleep, readJsonl, RAW } from "../../src/lib/io";
import type { RawFeedbackItem } from "../../src/lib/types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CACHE = join(RAW, "cache", "reddit");
mkdirSync(CACHE, { recursive: true });

function linksFromCorpus() {
  const items = readJsonl<RawFeedbackItem>(join(RAW, "reddit_all.jsonl"));
  const links = new Set<string>();
  for (const it of items) {
    const u = it.url || "";
    if (/\/comments\//.test(u)) links.add(u.replace(/\/$/, ""));
  }
  return [...links].slice(0, 12);
}

async function main() {
  const links = linksFromCorpus();
  console.log(`Comment threads to fetch: ${links.length}`);
  for (const link of links) {
    let rss = link.replace("https://www.reddit.com", "https://old.reddit.com");
    if (!rss.endsWith(".rss")) rss += ".rss";
    const key = createHash("sha1").update(rss).digest("hex");
    const path = join(CACHE, key + ".xml");
    if (existsSync(path) && readFileSync(path).length > 2000) {
      console.log("skip", rss);
      continue;
    }
    console.log("fetch", rss);
    await sleep(20000);
    const res = await fetch(rss, {
      headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    });
    console.log(" ", res.status);
    if (res.ok) {
      const t = await res.text();
      writeFileSync(path, t);
      console.log("  saved", t.length);
    } else {
      await sleep(40000);
    }
  }
}

main();
