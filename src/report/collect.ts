import { mkdir } from "node:fs/promises";
import { CACHE, DAILY_INPUT_JSON } from "../lib/paths.ts";
import { readTranslated } from "../lib/translated-feed.ts";

const WINDOW_MS = 24 * 3_600_000;

async function main() {
  const cutoff = Date.now() - WINDOW_MS;
  const recent = (await readTranslated())
    .filter((e) => e.pubDate.getTime() >= cutoff)
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .map((e) => ({
      title: e.titleJa,
      description: e.descriptionJa,
      link: e.link,
      source: e.sourceName,
      category: e.category ?? "uncategorized",
      published: e.pubDate.toISOString(),
    }));

  await mkdir(CACHE, { recursive: true });
  await Bun.write(DAILY_INPUT_JSON, JSON.stringify(recent, null, 2));
  console.log(`daily-input.json: ${recent.length} entries in the last 24h`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
