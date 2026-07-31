import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { dirname, join } from "path";
import type { RawFeedbackItem } from "./types";

export const ROOT = process.cwd();
export const DATA = join(ROOT, "data");
export const RAW = join(DATA, "raw");
export const PROCESSED = join(DATA, "processed");
export const PIPELINE = join(DATA, "pipeline");

export function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

export function hashText(text: string) {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function makeId(source: string, app: string, text: string, extra = "") {
  return `${source}_${app}_${hashText(text + extra)}`;
}

export function writeJsonl(path: string, rows: unknown[]) {
  ensureDir(dirname(path));
  const body = rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "");
  writeFileSync(path, body, "utf8");
}

export function appendJsonl(path: string, row: unknown) {
  ensureDir(dirname(path));
  appendFileSync(path, JSON.stringify(row) + "\n", "utf8");
}

export function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as T);
}

export function writeJson(path: string, data: unknown) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

export function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function isSubstantive(text: string) {
  const t = text.trim();
  if (t.length < 40) return false;
  const lowSignal = /^(good|bad|nice|ok|okay|super|great|awesome|love it|hate it|excellent|worst|best)[\s!.]*$/i;
  if (lowSignal.test(t)) return false;
  return true;
}

export function dedupeItems(items: RawFeedbackItem[]): RawFeedbackItem[] {
  const seen = new Set<string>();
  const out: RawFeedbackItem[] = [];
  for (const item of items) {
    const key = hashText(item.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
