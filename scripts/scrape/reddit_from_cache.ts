import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  RAW,
  makeId,
  writeJsonl,
  readJsonl,
  ensureDir,
} from "../../src/lib/io";
import type { RawFeedbackItem } from "../../src/lib/types";

const CACHE = join(RAW, "cache", "reddit");

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

function parseAtom(xml: string) {
  const entries: Array<{ title: string; link: string; content: string; updated?: string; author?: string }> = [];
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
    if (title || content) entries.push({ title, link, content, updated, author });
  }
  return entries;
}

async function main() {
  ensureDir(RAW);
  const existing = readJsonl<RawFeedbackItem>(join(RAW, "reddit_all.jsonl"));
  const byId = new Map(existing.map((e) => [e.id, e]));

  if (existsSync(CACHE)) {
    for (const file of readdirSync(CACHE).filter((f) => f.endsWith(".xml"))) {
      const xml = readFileSync(join(CACHE, file), "utf8");
      if (!xml.trim()) continue;
      for (const e of parseAtom(xml)) {
        const text = [e.title, e.content].filter(Boolean).join(" — ").trim();
        if (text.length < 30) continue;
        if (/submitted by/i.test(text) && text.length < 80) continue;
        const id = makeId("reddit", "instamart", text, e.link);
        byId.set(id, {
          id,
          source: "reddit",
          app: "instamart",
          author: e.author,
          title: e.title,
          text,
          date: e.updated ? new Date(e.updated).toISOString() : undefined,
          url: e.link,
          metadata: { kind: "rss_cache", file },
        });
      }
    }
  }

  const items = [...byId.values()];
  writeJsonl(join(RAW, "reddit_all.jsonl"), items);
  console.log(`Reddit corpus now ${items.length} items`);
}

main();
