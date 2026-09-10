import { mkdir, readdir } from "node:fs/promises";
import { Feed as FeedGen } from "feed";
import { marked } from "marked";
import { pageShell } from "./lib/html.ts";
import { DOMAIN_LABEL, domainArg } from "./lib/labels.ts";
import { SITE_URL, releaseDir, releaseMd, releaseXml } from "./lib/paths.ts";
import { jstDateString } from "./lib/urls.ts";

const MAX_FEED_ITEMS = 26; // ~half a year of weekly reports
const DATE_RE = /^\d{4}-\d{2}-\d{2}\.html$/;

async function main() {
  const domain = domainArg();
  const label = DOMAIN_LABEL[domain];
  const md = (
    await Bun.file(releaseMd(domain))
      .text()
      .catch(() => "")
  ).trim();
  if (!md) throw new Error(`${releaseMd(domain)} is empty — the Claude step produced nothing`);

  const date = jstDateString(); // the Monday the workflow runs
  const bodyHtml = await marked.parse(md);
  await mkdir(releaseDir(domain), { recursive: true });
  await Bun.write(
    `${releaseDir(domain)}/${date}.html`,
    pageShell({
      title: `${label} リリースレポート ${date}`,
      domain,
      crumb: "リリース",
      depth: 2,
      body: `<h1>${label} リリースレポート</h1>
<div class="report-head"><span class="badge">${label}</span><span class="date">${date} の週</span></div>
<article class="report">${bodyHtml}</article>`,
    }),
  );
  console.log(`wrote docs/release/${domain}/${date}.html`);

  const files = (await readdir(releaseDir(domain)))
    .filter((f) => DATE_RE.test(f))
    .sort()
    .reverse()
    .slice(0, MAX_FEED_ITEMS);

  const feed = new FeedGen({
    title: `${label} リリースレポート — ogontaro/rss`,
    description: `${label} 系ツールの週次リリースまとめ（Claude が注目リリースを選定）`,
    id: `${SITE_URL}/release-${domain}.xml`,
    link: `${SITE_URL}/`,
    language: "ja",
    copyright: "各リリースノートの著作権は原著者に帰属します。",
    updated: new Date(),
  });

  for (const file of files) {
    const d = file.replace(".html", "");
    const html = await Bun.file(`${releaseDir(domain)}/${file}`).text();
    const m = html.match(/<article class="report">([\s\S]*?)<\/article>/);
    feed.addItem({
      title: `${label} リリースレポート ${d}`,
      id: `${SITE_URL}/release/${domain}/${file}`,
      link: `${SITE_URL}/release/${domain}/${file}`,
      date: new Date(`${d}T22:30:00Z`),
      content: m ? m[1] : html,
    });
  }

  await Bun.write(releaseXml(domain), feed.rss2());
  console.log(`release-${domain}.xml: ${files.length} items`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
