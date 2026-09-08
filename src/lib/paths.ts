import { join } from "node:path";

export const ROOT = join(import.meta.dir, "..", "..");
export const DOCS = join(ROOT, "docs");
export const CACHE = join(ROOT, ".cache");

export const FEEDS_YAML = join(ROOT, "feeds.yaml");
export const CRITERIA_MD = join(ROOT, "report-criteria.md");

export const TRANSLATED_XML = join(DOCS, "translated.xml");
export const DAILY_XML = join(DOCS, "daily.xml");
export const DAILY_DIR = join(DOCS, "daily");
export const INDEX_HTML = join(DOCS, "index.html");
export const ASSETS_DIR = join(DOCS, "assets");

export const DAILY_INPUT_JSON = join(CACHE, "daily-input.json");
export const DAILY_REPORT_MD = join(CACHE, "daily-report.md");

/** Public site base, overridable for local preview. */
export const SITE_URL = process.env.SITE_URL ?? "https://ogontaro.github.io/rss";
