import type { Domain } from "./types.ts";
import { escapeHtml } from "./urls.ts";

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">';

/**
 * Shared page shell. `depth` is how many directories below docs/ the page lives
 * (0 for docs/index.html, 2 for docs/report/<domain>/<date>.html). `domain` sets
 * the accent palette; `crumb` is optional HTML shown next to the brand.
 */
export function pageShell(opts: {
  title: string;
  body: string;
  depth?: number;
  domain?: Domain;
  crumb?: string;
}): string {
  const base = opts.depth ? "../".repeat(opts.depth).replace(/\/$/, "") : ".";
  const domainAttr = opts.domain ? ` data-domain="${opts.domain}"` : "";
  const brand = opts.depth
    ? `<a class="brand" href="${base}/">ogontaro / rss</a>`
    : '<span class="brand">ogontaro / rss</span>';
  return `<!doctype html>
<html lang="ja"${domainAttr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
${FONTS}
<link rel="stylesheet" href="${base}/assets/style.css">
</head>
<body>
<header class="site-header">${brand}${opts.crumb ? `\n<span class="crumb">${opts.crumb}</span>` : ""}</header>
<main>
${opts.body}
</main>
<footer class="site-footer">タイトル・概要は機械翻訳です。記事本文の著作権は各原著者に帰属します。</footer>
</body>
</html>
`;
}
