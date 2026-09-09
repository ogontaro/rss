import { mkdir, readdir } from "node:fs/promises";
import { Feed as FeedGen } from "feed";
import { marked } from "marked";
import { pageShell } from "../lib/html.ts";
import { DAILY_DIR, DAILY_REPORT_MD, DAILY_XML, SITE_URL } from "../lib/paths.ts";
import { jstDateString } from "../lib/urls.ts";

const MAX_FEED_ITEMS = 60;
const DATE_RE = /^\d{4}-\d{2}-\d{2}\.html$/;

async function main() {
  const md = (await Bun.file(DAILY_REPORT_MD).text()).trim();
  if (!md) throw new Error(".cache/daily-report.md is empty — the Claude step produced nothing");

  const date = jstDateString();
  const bodyHtml = await marked.parse(md);
  await mkdir(DAILY_DIR, { recursive: true });
  await Bun.write(
    `${DAILY_DIR}/${date}.html`,
    pageShell({
      title: `レポート ${date}`,
      body: `<h1>レポート ${date}</h1>\n<article class="report">${bodyHtml}</article>`,
      base: "..",
    }),
  );
  console.log(`wrote docs/daily/${date}.html`);

  const files = (await readdir(DAILY_DIR))
    .filter((f) => DATE_RE.test(f))
    .sort()
    .reverse()
    .slice(0, MAX_FEED_ITEMS);

  const feed = new FeedGen({
    title: "レポート — ogontaro/rss",
    description:
      "AI・Kubernetes を中心とした重要な記事のまとめ（Claude によるキュレーション、月・水・金）",
    id: `${SITE_URL}/daily.xml`,
    link: `${SITE_URL}/`,
    language: "ja",
    copyright: "各記事の著作権は原著者に帰属します。",
    updated: new Date(),
  });

  for (const file of files) {
    const d = file.replace(".html", "");
    const html = await Bun.file(`${DAILY_DIR}/${file}`).text();
    const m = html.match(/<article class="report">([\s\S]*?)<\/article>/);
    feed.addItem({
      title: `レポート ${d}`,
      id: `${SITE_URL}/daily/${file}`,
      link: `${SITE_URL}/daily/${file}`,
      date: new Date(`${d}T22:00:00Z`),
      content: m ? m[1] : html,
    });
  }

  await Bun.write(DAILY_XML, feed.rss2());
  console.log(`daily.xml: ${files.length} items`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
