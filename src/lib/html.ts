import { escapeHtml } from "./urls.ts";

/**
 * Shared page shell. `depth` is how many directories below docs/ the page lives:
 * 0 for docs/index.html, 2 for docs/report/<domain>/<date>.html.
 */
export function pageShell(opts: { title: string; body: string; depth?: number }): string {
  const base = opts.depth ? "../".repeat(opts.depth).replace(/\/$/, "") : ".";
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<link rel="stylesheet" href="${base}/assets/style.css">
</head>
<body>
<header><a href="${base}/">ogontaro / rss</a></header>
<main>
${opts.body}
</main>
<footer>タイトル・概要は機械翻訳です。記事本文の著作権は各原著者に帰属します。</footer>
</body>
</html>
`;
}
