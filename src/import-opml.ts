import { XMLParser } from "fast-xml-parser";
import { stringify } from "yaml";
import { FEEDS_YAML } from "./lib/paths.ts";
import type { Feed } from "./lib/types.ts";

// Folders (compared post-slugify) that are Inoreader plumbing or off-topic for a
// tech digest. Feeds under these are imported but written with enabled: false.
const DISABLED_FOLDERS = new Set([
  "all_old",
  "youtube-subscriptions",
  "フィード管理キーワード一覧",
  "フィード管理元フィード一覧",
  "自動化用自動で重複記事を削除",
]);

function toArray<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

function slugify(label: string): string {
  return label
    .replace(/[【】「」]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: bun run src/import-opml.ts <inoreader-export.opml>");
    process.exit(1);
  }

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(await Bun.file(path).text());

  const feeds: Feed[] = [];
  let skipped = 0;
  const walk = (node: unknown, folder?: string): void => {
    for (const o of toArray((node as Record<string, unknown>)?.outline)) {
      const rec = o as Record<string, string>;
      const xmlUrl = rec["@_xmlUrl"];
      const label = rec["@_text"] || rec["@_title"] || "feed";
      if (rec.outline) {
        // a folder
        walk(o, label);
      } else if (xmlUrl && /^https?:\/\//.test(xmlUrl)) {
        const cat = folder ? slugify(folder) : undefined;
        feeds.push({
          url: xmlUrl,
          name: label,
          category: cat,
          enabled: !(cat && DISABLED_FOLDERS.has(cat)),
        });
      } else {
        // non-URL outline (Inoreader keyword-monitoring / *@ino.to) — needs API auth, out of scope
        skipped++;
      }
    }
  };
  walk(doc.opml?.body);

  const seen = new Set<string>();
  const unique = feeds.filter((f) => (seen.has(f.url) ? false : seen.add(f.url)));
  const enabled = unique.filter((f) => f.enabled).length;

  await Bun.write(FEEDS_YAML, stringify({ feeds: unique }));
  console.log(
    `feeds.yaml: ${unique.length} feeds (${enabled} enabled, ${unique.length - enabled} disabled), ` +
      `${skipped} non-URL outlines skipped`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
