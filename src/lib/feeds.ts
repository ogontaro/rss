import Parser from "rss-parser";
import type { Feed, SourceEntry } from "./types.ts";

const parser = new Parser({
  timeout: 20_000,
  headers: { "User-Agent": "ogontaro-rss/1.0 (+https://ogontaro.github.io/rss)" },
});

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fetch one source feed and normalize its items. Network/parse errors propagate. */
export async function fetchFeed(feed: Feed): Promise<SourceEntry[]> {
  const parsed = await parser.parseURL(feed.url);
  const entries: SourceEntry[] = [];
  for (const item of parsed.items) {
    const link = (item.link ?? "").trim();
    const guid = (item.guid ?? link).trim();
    if (!guid || !link) continue;
    const rawDesc = item.contentSnippet ?? item.summary ?? item.content ?? "";
    entries.push({
      guid,
      link,
      title: stripHtml(item.title ?? "(untitled)").slice(0, 300),
      description: stripHtml(rawDesc).slice(0, 500),
      pubDate: item.isoDate ? new Date(item.isoDate) : new Date(),
      sourceName: feed.name,
    });
  }
  return entries;
}
