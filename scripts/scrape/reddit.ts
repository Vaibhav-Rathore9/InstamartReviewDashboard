import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  RAW,
  ensureDir,
  makeId,
  writeJsonl,
  sleep,
} from "../../src/lib/io";
import type { RawFeedbackItem } from "../../src/lib/types";

const CACHE = join(RAW, "cache", "reddit");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SUBREDDITS = [
  "india",
  "bangalore",
  "mumbai",
  "delhi",
  "IndiaSocial",
  "IndianFood",
];

const QUERIES = [
  "instamart",
  "swiggy instamart",
  "blinkit vs instamart",
  "zepto vs instamart",
  "quick commerce groceries",
  "instamart pet OR baby OR reorder",
];

function cacheKey(url: string) {
  return createHash("sha1").update(url).digest("hex");
}

async function fetchCached(url: string): Promise<string | null> {
  ensureDir(CACHE);
  const key = cacheKey(url);
  const path = join(CACHE, `${key}.xml`);
  if (existsSync(path)) {
    return readFileSync(path, "utf8");
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml, application/atom+xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (res.status === 429 || res.status === 503) {
      const wait = 15000 * (attempt + 1);
      console.warn(`  rate limited (${res.status}), waiting ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} for ${url}`);
      return null;
    }
    const text = await res.text();
    writeFileSync(path, text, "utf8");
    await sleep(8000);
    return text;
  }
  return null;
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAtomEntries(xml: string): Array<{
  title: string;
  link: string;
  content: string;
  updated?: string;
  author?: string;
}> {
  const entries: Array<{
    title: string;
    link: string;
    content: string;
    updated?: string;
    author?: string;
  }> = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml))) {
    const block = m[1];
    const title = stripHtml((block.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || "");
    const link =
      (block.match(/<link[^>]*href="([^"]+)"/) || [])[1] ||
      (block.match(/<id>([^<]+)<\/id>/) || [])[1] ||
      "";
    const contentRaw =
      (block.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] ||
      (block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] ||
      "";
    const content = stripHtml(contentRaw);
    const updated = (block.match(/<updated>([^<]+)<\/updated>/) || [])[1];
    const author = stripHtml((block.match(/<name>([^<]+)<\/name>/) || [])[1] || "");
    if (title || content) {
      entries.push({ title, link, content, updated, author });
    }
  }
  return entries;
}

function toCommentRss(permalink: string) {
  let u = permalink.replace("https://www.reddit.com", "https://old.reddit.com");
  u = u.replace(/\/$/, "");
  if (!u.endsWith(".rss")) u += ".rss";
  return u;
}

async function main() {
  ensureDir(RAW);
  mkdirSync(CACHE, { recursive: true });
  const items: RawFeedbackItem[] = [];
  const threadLinks = new Set<string>();

  for (const sub of SUBREDDITS) {
    for (const q of QUERIES) {
      const url = `https://old.reddit.com/r/${sub}/search.rss?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&t=year`;
      console.log(`Search r/${sub} q="${q}"`);
      const xml = await fetchCached(url);
      if (!xml) continue;
      const entries = parseAtomEntries(xml);
      for (const e of entries) {
        if (e.link) threadLinks.add(e.link);
        const text = [e.title, e.content].filter(Boolean).join(" — ").trim();
        if (text.length < 20) continue;
        items.push({
          id: makeId("reddit", "instamart", text, e.link),
          source: "reddit",
          app: "instamart",
          author: e.author,
          title: e.title,
          text,
          date: e.updated ? new Date(e.updated).toISOString() : undefined,
          url: e.link,
          metadata: { subreddit: sub, query: q, kind: "post" },
        });
      }
    }
  }

  // Cap comment thread fetches for runtime
  const threads = [...threadLinks].slice(0, 25);
  console.log(`Fetching comments for ${threads.length} threads...`);
  for (const link of threads) {
    const rss = toCommentRss(link);
    console.log(`  comments ${rss}`);
    const xml = await fetchCached(rss);
    if (!xml) continue;
    const entries = parseAtomEntries(xml);
    for (const e of entries.slice(1)) {
      // skip OP metadata entry
      const text = e.content || e.title;
      if (text.length < 40) continue;
      if (/submitted by/i.test(text) && text.length < 80) continue;
      items.push({
        id: makeId("reddit", "instamart", text, e.link || link),
        source: "reddit",
        app: "instamart",
        author: e.author,
        title: e.title,
        text,
        date: e.updated ? new Date(e.updated).toISOString() : undefined,
        url: e.link || link,
        metadata: { kind: "comment", thread: link },
      });
    }
  }

  writeJsonl(join(RAW, "reddit_all.jsonl"), items);
  console.log(`Reddit total: ${items.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
