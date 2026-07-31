import { createHash } from "crypto";
import { writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { sleep } from "../../src/lib/io";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CACHE = join("data/raw/cache/reddit");
mkdirSync(CACHE, { recursive: true });

const urls = [
  "https://old.reddit.com/r/india/search.rss?q=instamart&restrict_sr=1&sort=relevance&t=year",
  "https://old.reddit.com/r/bangalore/search.rss?q=instamart&restrict_sr=1&sort=relevance&t=year",
  "https://old.reddit.com/r/mumbai/search.rss?q=instamart&restrict_sr=1&sort=relevance&t=year",
  "https://old.reddit.com/r/india/search.rss?q=blinkit%20vs%20zepto&restrict_sr=1&sort=relevance&t=year",
  "https://old.reddit.com/r/IndiaSocial/search.rss?q=quick%20commerce&restrict_sr=1&sort=relevance&t=year",
  "https://old.reddit.com/r/delhi/search.rss?q=swiggy%20instamart&restrict_sr=1&sort=relevance&t=year",
];

async function main() {
  for (const url of urls) {
    const key = createHash("sha1").update(url).digest("hex");
    const path = join(CACHE, key + ".xml");
    if (existsSync(path) && statSync(path).size > 1000) {
      console.log("skip cached", url);
      continue;
    }
    console.log("fetch", url);
    await sleep(22000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/atom+xml,text/xml,*/*" },
    });
    console.log(" ", res.status);
    if (res.ok) {
      const t = await res.text();
      writeFileSync(path, t);
      console.log("  saved", t.length);
    } else {
      await sleep(45000);
    }
  }
}

main();
