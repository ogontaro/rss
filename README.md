# rss

英語フィードを日本語で追うための個人用 RSS 基盤。GitHub Actions で更新し、GitHub Pages で公開する。
設計の詳細は [DESIGN.md](./DESIGN.md)。

- **翻訳フィード** (`docs/translated.xml`) — 購読フィードの新着エントリのタイトル・概要を日本語化した統合フィード。本文は「原文」＋「Google 翻訳」リンクで代替。
- **デイリーレポート** (`docs/daily.xml`, `docs/daily/*.html`) — 過去24時間の新着から Claude が重要な 5〜10 件を選び、日本語コメントを付けて 1 日 1 回配信。

## セットアップ

```sh
mise install      # bun
bun install
```

### 必要な Secrets（GitHub リポジトリ）

| 名前 | 用途 |
| --- | --- |
| `DEEPL_API_KEY` | タイトル・概要の翻訳（DeepL API。Free キーは末尾 `:fx`）。未設定なら未翻訳のまま通す |
| `CLAUDE_CODE_OAUTH_TOKEN` | デイリーレポートのキュレーション。`claude setup-token` で生成、約 1 年有効・自動更新なし |

### GitHub Pages

Settings → Pages → Source を **Deploy from a branch**、Branch を `main` / `/docs` に設定する。

## タスク

| コマンド | 内容 |
| --- | --- |
| `mise run translate` | フィード取得 → 新着を翻訳 → `docs/translated.xml` を再生成 |
| `mise run report:collect` | `docs/translated.xml` の直近 24h を `.cache/daily-input.json` へ |
| `mise run report:render` | `.cache/daily-report.md` → `docs/daily/*.html` と `docs/daily.xml` |
| `mise run build` | `docs/index.html` と assets を再生成 |
| `mise run import:opml -- <export.opml>` | Inoreader の OPML から `feeds.yaml` を生成（ワンショット） |
| `mise run serve` | `docs/` をローカルプレビュー |
| `mise run lint` / `mise run format` | Biome |

翻訳を試すには `DEEPL_API_KEY=... mise run translate`。

## 仕組み

```
translate.yml (6h ごと)   fetch → translate → build → commit docs/
daily.yml     (07:00 JST) translate → collect → claude-code-action → render → build → commit docs/
```

状態は `docs/` の生成物そのもの。翻訳済みは `translated.xml` の guid 集合で判定し、
デイリーは `docs/daily/YYYY-MM-DD.html` の有無で判定する。専用の状態ストアは持たない。
