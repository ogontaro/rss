import { mkdir, readdir } from "node:fs/promises";
import { pageShell } from "./lib/html.ts";
import { ASSETS_DIR, DAILY_DIR, INDEX_HTML } from "./lib/paths.ts";
import { STYLE_CSS } from "./lib/style.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}\.html$/;

async function main() {
  await mkdir(ASSETS_DIR, { recursive: true });
  await Bun.write(`${ASSETS_DIR}/style.css`, STYLE_CSS);

  let reports: string[] = [];
  try {
    reports = (await readdir(DAILY_DIR))
      .filter((f) => DATE_RE.test(f))
      .sort()
      .reverse();
  } catch {
    // docs/daily/ not created yet
  }

  const list = reports
    .map((f) => `<li><a href="daily/${f}">${f.replace(".html", "")}</a></li>`)
    .join("\n");

  const body = `<h1>ogontaro / rss</h1>
<p>英語フィードを日本語で追うための個人用 RSS。</p>
<h2>フィード</h2>
<ul>
<li><a href="translated.xml">翻訳フィード</a> — 購読フィードの新着タイトル・概要を日本語化</li>
<li><a href="daily.xml">レポート</a> — 月・水・金の AI / Kubernetes まとめ</li>
</ul>
<h2>レポート</h2>
<ul>
${list || "<li>まだありません</li>"}
</ul>`;

  await Bun.write(INDEX_HTML, pageShell({ title: "ogontaro / rss", body }));
  console.log(`index.html: ${reports.length} daily reports linked`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
