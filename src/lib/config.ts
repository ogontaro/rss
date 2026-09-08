import { parse } from "yaml";
import { FEEDS_YAML } from "./paths.ts";
import type { FeedsConfig } from "./types.ts";

export async function loadFeeds(): Promise<FeedsConfig> {
  const raw = await Bun.file(FEEDS_YAML).text();
  const parsed = parse(raw) as FeedsConfig;
  if (!parsed?.feeds?.length) {
    throw new Error("feeds.yaml has no feeds");
  }
  for (const f of parsed.feeds) {
    if (!f.url || !f.name)
      throw new Error(`feeds.yaml: entry missing url or name: ${JSON.stringify(f)}`);
    f.enabled ??= true;
  }
  return parsed;
}
