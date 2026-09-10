import { mkdir, readdir } from "node:fs/promises";
import { Feed as FeedGen } from "feed";
import { marked } from "marked";
import { pageShell } from "./lib/html.ts";
import { DOMAIN_LABEL, domainArg } from "./lib/labels.ts";
import { SITE_URL, reportDir, reportMd, reportXml } from "./lib/paths.ts";
import { jstDateString } from "./lib/urls.ts";

const MAX_FEED_ITEMS = 60;
const DATE_RE = /^\d{4}-\d{2}-\d{2}\.html$/;

async function main() {
  const domain = domainArg();
  const label = DOMAIN_LABEL[domain];
  const md = (
    await Bun.file(reportMd(domain))
      .text()
      .catch(() => "")
  ).trim();
  if (!md) throw new Error(`${reportMd(domain)} is empty — the Claude step produced nothing`);

  const date = jstDateString();
  const bodyHtml = await marked.parse(md);
  await mkdir(reportDir(domain), { recursive: true });
  await Bun.write(
    `${reportDir(domain)}/${date}.html`,
    pageShell({
      title: `${label} レポート ${date}`,
      domain,
      crumb: "レポート",
      depth: 2,
      body: `<h1>${label} レポート</h1>
<div class="report-head"><span class="badge">${label}</span><span class="date">${date}</span></div>
<article class="report">${bodyHtml}</article>`,
    }),
  );
  console.log(`wrote docs/report/${domain}/${date}.html`);

  const files = (await readdir(reportDir(domain)))
    .filter((f) => DATE_RE.test(f))
    .sort()
    .reverse()
    .slice(0, MAX_FEED_ITEMS);

  const feed = new FeedGen({
    title: `${label} レポート — ogontaro/rss`,
    description: `${label} 系の新着から重要な記事を Claude が選定した日次レポート`,
    id: `${SITE_URL}/report-${domain}.xml`,
    link: `${SITE_URL}/`,
    language: "ja",
    copyright: "各記事の著作権は原著者に帰属します。",
    updated: new Date(),
  });

  for (const file of files) {
    const d = file.replace(".html", "");
    const html = await Bun.file(`${reportDir(domain)}/${file}`).text();
    const m = html.match(/<article class="report">([\s\S]*?)<\/article>/);
    feed.addItem({
      title: `${label} レポート ${d}`,
      id: `${SITE_URL}/report/${domain}/${file}`,
      link: `${SITE_URL}/report/${domain}/${file}`,
      date: new Date(`${d}T22:00:00Z`),
      content: m ? m[1] : html,
    });
  }

  await Bun.write(reportXml(domain), feed.rss2());
  console.log(`report-${domain}.xml: ${files.length} items`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
