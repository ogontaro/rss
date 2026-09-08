import { XMLParser } from "fast-xml-parser";
import { stringify } from "yaml";
import { FEEDS_YAML } from "./lib/paths.ts";
import type { Feed } from "./lib/types.ts";

function toArray<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
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
  const walk = (node: unknown, category?: string): void => {
    for (const o of toArray((node as Record<string, unknown>)?.outline)) {
      const rec = o as Record<string, string>;
      const xmlUrl = rec["@_xmlUrl"];
      const label = rec["@_text"] || rec["@_title"] || xmlUrl || "feed";
      if (xmlUrl) {
        feeds.push({ url: xmlUrl, name: label, category, enabled: true });
      } else {
        walk(o, label.toLowerCase().replace(/\s+/g, "-"));
      }
    }
  };
  walk(doc.opml?.body);

  const seen = new Set<string>();
  const unique = feeds.filter((f) => (seen.has(f.url) ? false : seen.add(f.url)));

  await Bun.write(FEEDS_YAML, stringify({ feeds: unique }));
  console.log(`feeds.yaml: ${unique.length} feeds imported`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
