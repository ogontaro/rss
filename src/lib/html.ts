import { escapeHtml } from "./urls.ts";

/** Minimal shared page shell. `base` is the relative path to docs/ root ("." or ".."). */
export function pageShell(opts: { title: string; body: string; base?: string }): string {
  const base = opts.base ?? ".";
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<link rel="stylesheet" href="${base}/assets/style.css">
<link rel="alternate" type="application/rss+xml" title="翻訳フィード" href="${base}/translated.xml">
<link rel="alternate" type="application/rss+xml" title="レポート" href="${base}/daily.xml">
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
