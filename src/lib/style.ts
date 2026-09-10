/** Written to docs/assets/style.css by build.ts (single owner). */
export const STYLE_CSS = `:root {
  --bg: #fbfbf9;
  --surface: #ffffff;
  --fg: #1c1c1e;
  --muted: #6b6b70;
  --line: #e7e7e2;
  --accent: #4f46e5;
  --accent-soft: rgba(79, 70, 229, 0.10);
  --radius: 10px;
  --font: "Inter", -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}
:root[data-domain="claude"]     { --accent: #c2410c; --accent-soft: rgba(194, 65, 12, 0.10); }
:root[data-domain="kubernetes"] { --accent: #2563eb; --accent-soft: rgba(37, 99, 235, 0.10); }
:root[data-domain="aws"]        { --accent: #b45309; --accent-soft: rgba(180, 83, 9, 0.10); }

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #131316;
    --surface: #1b1b1f;
    --fg: #e9e9ea;
    --muted: #9a9aa1;
    --line: #2b2b31;
    --accent: #8b8bf5;
    --accent-soft: rgba(139, 139, 245, 0.14);
  }
  :root[data-domain="claude"]     { --accent: #fb923c; --accent-soft: rgba(251, 146, 60, 0.14); }
  :root[data-domain="kubernetes"] { --accent: #60a5fa; --accent-soft: rgba(96, 165, 250, 0.14); }
  :root[data-domain="aws"]        { --accent: #fbbf24; --accent-soft: rgba(251, 191, 36, 0.14); }
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 400 16px/1.75 var(--font);
  font-feature-settings: "palt";
}

.site-header {
  max-width: 780px;
  margin: 0 auto;
  padding: 1.1rem 1.2rem;
  display: flex;
  align-items: baseline;
  gap: .7rem;
  border-bottom: 1px solid var(--line);
}
.brand { font-weight: 700; color: var(--fg); text-decoration: none; letter-spacing: .01em; }
.crumb {
  font-size: .78rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: .15rem .6rem;
  border-radius: 999px;
}

main { max-width: 780px; margin: 0 auto; padding: 2.2rem 1.2rem 5rem; }
a { color: var(--accent); text-underline-offset: 2px; }
h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: .01em; margin: .2rem 0 1rem; }
h2 { font-size: 1.15rem; font-weight: 600; margin: 2.2rem 0 .6rem; }
h3 { font-size: 1.06rem; font-weight: 600; margin: 0 0 .35rem; }
p { margin: .35rem 0 1rem; }
code {
  font: .86em/1.4 var(--mono);
  background: var(--accent-soft);
  padding: .1em .42em;
  border-radius: 5px;
}

.lead { color: var(--muted); margin-bottom: 2.2rem; }

/* ---- dashboard ---- */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem; }
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-top: 3px solid var(--card-accent, var(--accent));
  border-radius: var(--radius);
  padding: 1rem 1.15rem 1.2rem;
}
.card[data-domain="claude"]     { --card-accent: #c2410c; }
.card[data-domain="kubernetes"] { --card-accent: #2563eb; }
.card[data-domain="aws"]        { --card-accent: #b45309; }
@media (prefers-color-scheme: dark) {
  .card[data-domain="claude"]     { --card-accent: #fb923c; }
  .card[data-domain="kubernetes"] { --card-accent: #60a5fa; }
  .card[data-domain="aws"]        { --card-accent: #fbbf24; }
}
.card h2 { margin: .1rem 0 .7rem; font-size: 1.1rem; }
.card .latest { font-size: .92rem; margin: .25rem 0; }
.card .latest a { font-weight: 600; }
.card .latest.none { color: var(--muted); }
.pills { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .9rem; }
.pills a {
  font-size: .77rem;
  text-decoration: none;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: .2rem .62rem;
}
.pills a:hover { border-color: var(--card-accent, var(--accent)); color: var(--card-accent, var(--accent)); }

/* ---- report / release pages ---- */
.report-head {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex-wrap: wrap;
  margin: -.4rem 0 1.8rem;
}
.badge {
  font-size: .74rem;
  font-weight: 700;
  letter-spacing: .03em;
  color: #fff;
  background: var(--accent);
  padding: .22rem .62rem;
  border-radius: 6px;
}
.report-head .date { color: var(--muted); font-size: .9rem; }

.report > h2 { font-size: .95rem; font-weight: 600; color: var(--muted); margin: 0 0 1.6rem; }
.report h3 { margin-top: 1.9rem; padding-top: 1.7rem; border-top: 1px solid var(--line); }
.report > h2 + h3 { border-top: 0; padding-top: 0; margin-top: 0; }
.report p { margin: .4rem 0 1rem; }
.report h3 + p { margin-top: .5rem; }

/* the 破壊的変更 line (a paragraph that leads with <strong>) — understated label */
.report p:has(> strong:first-child) {
  font-size: .88rem;
  color: var(--muted);
  border-left: 2px solid var(--line);
  padding-left: .7rem;
  margin: .4rem 0 .7rem;
}
.report p > strong:first-child { color: var(--fg); }

/* read-more links -> inline chips. Works whether they share the comment paragraph or not. */
.report a[href^="http"] {
  display: inline-block;
  font-size: .8rem;
  text-decoration: none;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: .22rem .66rem;
  margin: .5rem .35rem 0 0;
}
.report a[href^="http"]:hover { border-color: var(--accent); color: var(--accent); }

.site-footer {
  max-width: 780px;
  margin: 3rem auto 0;
  padding: 1.3rem 1.2rem 2.5rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: .82rem;
}
`;
