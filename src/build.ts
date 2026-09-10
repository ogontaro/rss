import { mkdir, readdir } from "node:fs/promises";
import { CONTENT_DOMAINS, RELEASE_DOMAINS } from "./lib/config.ts";
import { pageShell } from "./lib/html.ts";
import { DOMAIN_LABEL } from "./lib/labels.ts";
import { ASSETS_DIR, INDEX_HTML, OPML, SITE_URL, releaseDir, reportDir } from "./lib/paths.ts";
import { STYLE_CSS } from "./lib/style.ts";
import type { Domain } from "./lib/types.ts";
import { escapeHtml } from "./lib/urls.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}\.html$/;

async function latestDate(dir: string): Promise<string | null> {
  try {
    const dates = (await readdir(dir)).filter((f) => DATE_RE.test(f)).sort();
    const last = dates.at(-1);
    return last ? last.replace(".html", "") : null;
  } catch {
    return null;
  }
}

type FeedRef = { label: string; file: string };

function feedRefs(): FeedRef[] {
  const refs: FeedRef[] = [];
  for (const d of CONTENT_DOMAINS) {
    refs.push({ label: `翻訳: ${DOMAIN_LABEL[d]}`, file: `translated-${d}.xml` });
    refs.push({ label: `レポート: ${DOMAIN_LABEL[d]}`, file: `report-${d}.xml` });
  }
  for (const d of RELEASE_DOMAINS) {
    refs.push({ label: `リリース: ${DOMAIN_LABEL[d]}`, file: `release-${d}.xml` });
  }
  return refs;
}

async function domainCard(d: Domain): Promise<string> {
  const report = await latestDate(reportDir(d));
  const isRelease = (RELEASE_DOMAINS as string[]).includes(d);
  const release = isRelease ? await latestDate(releaseDir(d)) : null;
  const lines: string[] = [];
  lines.push(
    report
      ? `<li>日次レポート最新: <a href="report/${d}/${report}.html">${report}</a></li>`
      : "<li>日次レポート: まだありません</li>",
  );
  if (isRelease) {
    lines.push(
      release
        ? `<li>週次リリース最新: <a href="release/${d}/${release}.html">${release}</a></li>`
        : "<li>週次リリース: まだありません</li>",
    );
  }
  lines.push(
    `<li>フィード: <a href="translated-${d}.xml">翻訳</a> / <a href="report-${d}.xml">レポート</a>${
      isRelease ? ` / <a href="release-${d}.xml">リリース</a>` : ""
    }</li>`,
  );
  return `<section class="card">\n<h2>${DOMAIN_LABEL[d]}</h2>\n<ul>\n${lines.join("\n")}\n</ul>\n</section>`;
}

function opmlXml(): string {
  const outlines = feedRefs()
    .map(
      (r) =>
        `    <outline type="rss" text="${escapeHtml(r.label)}" title="${escapeHtml(r.label)}" xmlUrl="${SITE_URL}/${r.file}"/>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head><title>ogontaro / rss</title></head>
  <body>
${outlines}
  </body>
</opml>
`;
}

async function main() {
  await mkdir(ASSETS_DIR, { recursive: true });
  await Bun.write(`${ASSETS_DIR}/style.css`, STYLE_CSS);
  await Bun.write(OPML, opmlXml());

  const cards = await Promise.all(CONTENT_DOMAINS.map(domainCard));
  const body = `<h1>ogontaro / rss</h1>
<p>Claude / Kubernetes / AWS の情報を日本語で追うための個人用 RSS。
一括購読は <a href="subscriptions.opml">subscriptions.opml</a>。</p>
${cards.join("\n")}`;

  await Bun.write(INDEX_HTML, pageShell({ title: "ogontaro / rss", body }));
  console.log(`index.html + subscriptions.opml (${feedRefs().length} feeds)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
