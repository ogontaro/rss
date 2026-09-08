import { Feed as FeedGen } from "feed";
import Parser from "rss-parser";
import { SITE_URL, TRANSLATED_XML } from "./paths.ts";
import type { TranslatedEntry } from "./types.ts";
import { escapeHtml, googleTranslateUrl } from "./urls.ts";

const MAX_ITEMS = 100;
const TITLE_SEP = " — ";
const parser = new Parser();

function splitTitle(full: string): { titleJa: string; sourceName: string } {
  const i = full.lastIndexOf(TITLE_SEP);
  return i === -1
    ? { titleJa: full, sourceName: "" }
    : { titleJa: full.slice(0, i), sourceName: full.slice(i + TITLE_SEP.length) };
}

/** Read back the persisted translated feed. Fields round-trip as plain text; links are re-derived on write. */
export async function readTranslated(): Promise<TranslatedEntry[]> {
  const file = Bun.file(TRANSLATED_XML);
  if (!(await file.exists())) return [];
  const parsed = await parser.parseString(await file.text());
  return parsed.items.map((item) => {
    const { titleJa, sourceName } = splitTitle(item.title ?? "");
    return {
      guid: (item.guid ?? item.link ?? "").trim(),
      link: (item.link ?? "").trim(),
      titleJa,
      descriptionJa: (item.contentSnippet ?? item.summary ?? "").trim(),
      pubDate: item.isoDate ? new Date(item.isoDate) : new Date(),
      sourceName,
      category: (item.categories?.[0] as string | undefined) ?? undefined,
    };
  });
}

/** Rewrite the translated feed: de-dupe by guid, newest first, truncate to MAX_ITEMS. */
export async function writeTranslated(entries: TranslatedEntry[]): Promise<number> {
  const byGuid = new Map<string, TranslatedEntry>();
  for (const e of entries) if (e.guid && !byGuid.has(e.guid)) byGuid.set(e.guid, e);
  const items = [...byGuid.values()]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, MAX_ITEMS);

  const feed = new FeedGen({
    title: "翻訳フィード — ogontaro/rss",
    description: "購読フィードの新着エントリのタイトルと概要を日本語化した統合フィード",
    id: `${SITE_URL}/translated.xml`,
    link: `${SITE_URL}/`,
    language: "ja",
    copyright: "各記事の著作権は原著者に帰属します。翻訳は機械翻訳です。",
    updated: items[0]?.pubDate ?? new Date(),
  });

  for (const e of items) {
    feed.addItem({
      title: e.sourceName ? `${e.titleJa}${TITLE_SEP}${e.sourceName}` : e.titleJa,
      id: e.guid,
      link: e.link,
      date: e.pubDate,
      description: e.descriptionJa || undefined,
      content:
        `<p><a href="${escapeHtml(e.link)}">原文を読む</a> / ` +
        `<a href="${escapeHtml(googleTranslateUrl(e.link))}">Google 翻訳で全文を読む</a></p>`,
      category: e.category ? [{ name: e.category }] : undefined,
    });
  }

  await Bun.write(TRANSLATED_XML, feed.rss2());
  return items.length;
}
