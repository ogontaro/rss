import { loadFeeds } from "./lib/config.ts";
import { fetchFeed } from "./lib/feeds.ts";
import { translateBatch } from "./lib/translate.ts";
import { readTranslated, writeTranslated } from "./lib/translated-feed.ts";
import type { TranslatedEntry } from "./lib/types.ts";

async function main() {
  const { feeds } = await loadFeeds();
  const active = feeds.filter((f) => f.enabled);
  const existing = await readTranslated();
  const known = new Set(existing.map((e) => e.guid));

  const fresh: TranslatedEntry[] = [];
  let anyFeedOk = false;
  for (const feed of active) {
    let entries: Awaited<ReturnType<typeof fetchFeed>>;
    try {
      entries = await fetchFeed(feed);
      anyFeedOk = true;
    } catch (err) {
      console.error(`skip ${feed.name}: ${(err as Error).message}`);
      continue;
    }

    const novel = entries.filter((e) => !known.has(e.guid));
    if (novel.length === 0) continue;

    const titlesJa = await translateBatch(novel.map((e) => e.title));
    const descsJa = await translateBatch(novel.map((e) => e.description));
    novel.forEach((e, i) => {
      known.add(e.guid);
      fresh.push({
        guid: e.guid,
        link: e.link,
        titleJa: titlesJa[i],
        descriptionJa: descsJa[i],
        pubDate: e.pubDate,
        sourceName: e.sourceName,
        category: e.category,
      });
    });
    console.log(`${feed.name}: +${novel.length}`);
  }

  // Never overwrite the feed (our only state store) from a run where no feed loaded —
  // that would drop every guid and mark old entries as new next time.
  if (!anyFeedOk) {
    console.error("every active feed failed to fetch — leaving translated.xml untouched");
    process.exit(1);
  }

  const count = await writeTranslated([...fresh, ...existing]);
  console.log(`translated.xml: ${count} items (+${fresh.length} new)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
