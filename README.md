# rss

Claude / Kubernetes / AWS の情報を日本語で追うための個人用 RSS 基盤。GitHub Actions で更新し、
GitHub Pages で公開する。設計の詳細は [DESIGN.md](./DESIGN.md)。

**公開先**: <https://ogontaro.github.io/rss/> ／ 一括購読 OPML: `https://ogontaro.github.io/rss/subscriptions.opml`

ドメイン（claude / kubernetes / aws）ごとに独立したパイプライン。機能は混ざらない。

| 種別 | 内容 | 頻度 | フィード |
| --- | --- | --- | --- |
| 翻訳フィード | 購読フィードの新着タイトル・概要を DeepL で日本語化 | 6 時間ごと | `translated-<domain>.xml` |
| レポート | 直近 24h の新着から Claude が重要記事を 5〜10 件選定・日本語コメント | 毎日 07:00 JST | `report-<domain>.xml` |
| リリースレポート | 直近 7 日のツールリリースを Claude が整理（破壊的変更を先頭） | 毎週月 07:30 JST | `release-<domain>.xml`（aws / kubernetes のみ） |

翻訳フィード・レポートは 3 ドメイン、リリースレポートは aws / kubernetes の 2 ドメイン。計 8 フィード。

## セットアップ

```sh
mise install      # bun
bun install
```

### Secrets（設定済み）

| 名前 | 用途 |
| --- | --- |
| `DEEPL_API_KEY` | タイトル・概要の翻訳（DeepL API。Free キーは末尾 `:fx`）。未設定なら未翻訳のまま通す |
| `CLAUDE_CODE_OAUTH_TOKEN` | レポートのキュレーション。`claude setup-token` で生成、約 1 年有効・自動更新なし。401 で落ちたら再生成 |

### GitHub Pages（設定済み）

Source は **Deploy from a branch** / `main` / `/docs`。ワークフローが `docs/` をコミットすると
`pages-build-deployment` が自動で走り公開される。

## フィード管理

`feeds.yaml` が購読リストの正。1 エントリ = `{url, name, domain, kind}`。
`domain` は claude / kubernetes / aws、`kind` は content（翻訳＋レポート）/ release（週次リリース）。
公開前提なので、趣味・キー付き URL は入れない。選定基準・関心領域は `report-criteria/<name>.md`。

## タスク

| コマンド | 内容 |
| --- | --- |
| `mise run translate` | 全ドメインの content フィードを取得・翻訳して `translated-<domain>.xml` を再生成 |
| `mise run report:collect <domain>` | 直近 24h を `.cache/report-<domain>-input.json` へ |
| `mise run report:render <domain>` | `.cache/report-<domain>.md` → `docs/report/<domain>/*.html` と `report-<domain>.xml` |
| `mise run release:collect <domain>` | 直近 7 日のリリースを `.cache/release-<domain>-input.json` へ |
| `mise run release:render <domain>` | `.cache/release-<domain>.md` → `docs/release/<domain>/*.html` と `release-<domain>.xml` |
| `mise run build` | `docs/index.html` / `subscriptions.opml` / assets を再生成 |
| `mise run serve` | `docs/` をローカルプレビュー |
| `mise run lint` / `mise run format` | Biome |

翻訳を試すには `DEEPL_API_KEY=... mise run translate`。

## 仕組み

```
translate.yml (6h ごと)        全ドメイン翻訳 → build → commit docs/
report.yml    (毎日 07:00 JST) 翻訳最新化 → ドメインごとに collect → claude-code-action → render → build → commit
release.yml   (月 07:30 JST)   ドメインごとに collect → claude-code-action → render → build → commit
```

- 状態は `docs/` の生成物そのもの（`translated-<domain>.xml` の guid 集合、`report/<domain>/YYYY-MM-DD.html` の有無）
- `translated-*.xml` / `report-*.xml` / `release-*.xml` は **CI でのみ生成する**。ローカル生成物はコミットしない
