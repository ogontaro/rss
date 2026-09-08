# RSS 運用リポジトリ 設計

## 目的

英語のフィードを日本語で追えるようにする個人用の RSS 基盤。GitHub Actions だけで完結させ、
生成物を GitHub Pages で公開する。実装は 2 機能に絞る。

- **翻訳フィード**: 購読フィードの新着エントリのタイトル・description を日本語化した統合 RSS を配信する。
- **デイリーレポート**: 過去 24 時間の新着から重要なものを Claude に選ばせ、日本語コメント付きの
  レポートページと専用 RSS を 1 日 1 回配信する。

読むのは自分の RSS リーダー（Inoreader など）。生成した公開フィード URL を手作業で購読登録する。

## 全体構成

| 項目 | 決定 |
| --- | --- |
| ランタイム | Bun + TypeScript |
| ツール/タスク管理 | mise（Bun のバージョンピン、タスク定義） |
| Lint / Format | Biome |
| パッケージ構成 | 単一パッケージ（モノレポ分割しない） |
| 実行基盤 | すべて GitHub Actions 上。ローカル常用スクリプトは持たない |
| 公開 | GitHub Pages。`ogontaro/rss` の `main` ブランチの `docs/` を配信（deploy from branch） |
| 公開 URL | `https://ogontaro.github.io/rss/` |
| カスタムドメイン | 使わない（購読 URL を一方通行で確定させるため） |
| AI 呼び出し | `anthropics/claude-code-action@v1` をワークフローの一ステップとして実行（モデル: Sonnet） |
| 翻訳エンジン | DeepL API Free を第一候補（実装着手時に登録要件・無料枠を確認）。不可なら MyMemory 等のキー不要 MT にフォールバック |

### Round 2 からの修正点

Pages のデプロイを `actions/deploy-pages`（アーティファクト方式）ではなく
**`main:/docs` からの deploy from branch** に変更する。理由: 状態管理を「生成物そのもの」に置くと決めたため、
生成物が git にコミットされて残る方式のほうが素直。前回アーティファクトを取り直す処理が不要になる。
代償はワークフローによるコミットが 1 日 5 回程度増えること（許容する）。

## データ: feeds.yaml

購読フィードの正はこのファイル。Inoreader API 連携は行わない。

```yaml
feeds:
  - url: https://example.com/feed.xml
    name: Example Blog       # 表示名・ソース表記に使う
    category: ai             # デイリーレポートの見出し分けに使う。任意
    enabled: true            # false で一時停止
```

### 初期テスト用フィード（暫定・後で入れ替える）

実運用のフィードリストは、動作確認後に Inoreader の OPML エクスポートを
`mise run import:opml` で変換して差し替える。それまでは以下でテストする。

| name | url | category |
| --- | --- | --- |
| Simon Willison's Weblog | https://simonwillison.net/atom/everything/ | ai |
| Julia Evans | https://jvns.ca/atom.xml | infra |
| Rust Blog | https://blog.rust-lang.org/feed.xml | rust |
| Kubernetes Blog | https://kubernetes.io/feed.xml | infra |
| Hacker News (200+ points) | https://hnrss.org/frontpage?points=200 | general |

## 機能 A: 翻訳フィード

### 処理（`src/translate.ts`, 6 時間ごと）

1. `feeds.yaml` の `enabled: true` を全件取得・パース。
2. 各エントリの guid（無ければ link）を、既存 `docs/translated.xml` の guid 集合と照合。
   既出はスキップ、新規のみ処理。
3. 新規エントリのタイトルと description を翻訳エンジンで日本語化。
4. 既存フィードに新規エントリを追加し、公開日時の降順で **直近 100 件**に truncate して
   `docs/translated.xml` を再生成。

> truncate 件数（100）はデイリーレポートの入力元でもある。**24 時間の新着総数がこれを超えないこと**が前提。
> 5 フィードのテストでは十分だが、OPML で本番フィードに差し替える際に再検討する。

### エントリの中身

| 要素 | 内容 |
| --- | --- |
| title | 翻訳した日本語タイトル ＋ 末尾に ` — <ソース名>` |
| description | 翻訳した日本語 description（原文が空なら空） |
| link | **原文記事の URL** |
| content | 「原文を読む」＋「Google 翻訳で全文を読む」の 2 リンクのみ。原文本文は転載しない |
| guid | 原文エントリの guid（無ければ link）。永続・不変 |
| pubDate | 原文の公開日時 |

### Google 翻訳リンクの生成

```
https://translate.google.com/translate?sl=auto&tl=ja&u=${encodeURIComponent(articleUrl)}
```

- `sl=auto`（ソース言語がばらつくため）。
- URL 全体を `encodeURIComponent`（スキーム含む。対象 URL 内の `&` `#` もこれで安全）。
- **生成前に記事 URL からスペースを除去する**（`%20` / `+` が `u=` に入ると HTTP 400）。
- `translate.goog` 直リンク形式は IDN・長ホストで壊れるため使わない。

## 機能 B: デイリーレポート

### 処理（`daily.yml`, 毎日 JST 7:00 = cron `0 22 * * *`）

0. **機能 A（`src/translate.ts`）を最初に実行**して `docs/translated.xml` を最新化する。
   これにより「翻訳フィードとデイリーレポートで同じ記事のタイトルが一致する」「翻訳を二重に走らせない」
   が保証され、`daily.yml` が単体で完結する（別スケジュールへの依存を作らない）。
1. `src/report/collect.ts`: **`docs/translated.xml` を読み**、`pubDate` が過去 24 時間のエントリだけに絞り、
   日本語タイトル・description・link・category のリストを `.cache/daily-input.json` に書き出す。
   ここでは翻訳しない（機能 A の生成物をそのまま使う）。
2. `anthropics/claude-code-action@v1`:
   - 認証: `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`
   - 許可ツール: Read / Write のみ（ネットワーク・シェル不可）
   - プロンプト: `.cache/daily-input.json` と `report-criteria.md` を読み、基準に沿って
     重要なものを **5〜10 件**選び、`.cache/daily-report.md` に Markdown で書く。
3. `src/report/render.ts`: `.cache/daily-report.md` を HTML 化して `docs/daily/YYYY-MM-DD.html` を生成し、
   `docs/daily.xml` に当日エントリを追加（フィードは直近 60 エントリで truncate、HTML ページは全て保持）。
   `docs/index.html` は書かない。
4. `src/build.ts`: `docs/daily/` の中身と `docs/translated.xml` から `docs/index.html` と assets を再生成する。
   `docs/index.html` の書き手はここだけ（複数箇所から同じファイルを触らない）。

### レポートの構成

- 見出し「今日の N 本」
- 各項目: 日本語タイトル / Claude の日本語コメント 2〜3 文 / 「原文を読む」＋「Google 翻訳で全文を読む」
- `category` があればセクション分け

### daily.xml のエントリ

1 日 1 エントリ。`content` にレポート全文（HTML）をインラインで入れる（リーダー単体で読み切れる）。

### 「重要」の判定基準（`report-criteria.md`）

関心領域を主、一般的な話題性・影響度を従とする（Round 3 Q4 = 案 C）。
初期値は下記。あとから自由に編集できる。

- AI / LLM / エージェント
- クラウドインフラ / Kubernetes
- Rust
- 個人開発 / インディーハッカー
- 開発生産性 / ツール
- RSS / 自動化

### Claude が失敗・不達のとき

**ワークフローを失敗させる（fail loudly）**。GitHub の失敗通知で気づく。
無キュレーションでの公開はしない。翻訳フィード（機能 A）は Claude 非依存なので影響を受けない。

## 状態管理

専用の状態ストア（DB・JSON 台帳）は持たない。生成物そのものを状態とみなす。

- 翻訳フィード: 既存 `docs/translated.xml` の guid 集合に無いものだけ処理。
- デイリーレポート: `docs/daily/YYYY-MM-DD.html` が既にあればその日はスキップ。
- 各フィードは件数上限で truncate（翻訳 100 / daily 60）。
- 翻訳が 1 フィードも取得できなかった実行は `translated.xml` を書き換えず異常終了する
  （空フィードで guid 集合を消すと、次回に全件が新着扱いになるため）。

> **`docs/translated.xml` と `docs/daily.xml` は CI でのみ生成する。ローカルで生成したものをコミットしない。**
> guid は永続で、翻訳エンジン未設定のパススルー実行でもエントリは「翻訳済み」として guid 集合に入る。
> ローカル生成物をコミットすると、その分は本番でも二度と翻訳されない。初期コミットに含めるのは
> `docs/index.html` と `docs/assets/` だけ。

## GitHub Actions ワークフロー

| ファイル | トリガー | 内容 |
| --- | --- | --- |
| `.github/workflows/translate.yml` | `schedule: 0 */6 * * *` ＋ `workflow_dispatch` | 機能 A。`docs/translated.xml` を更新 → `build.ts` → `docs/` をコミット |
| `.github/workflows/daily.yml` | `schedule: 0 22 * * *` ＋ `workflow_dispatch` | 機能 A（先頭で最新化）→ collect → claude-code-action → render → `build.ts` → `docs/` をコミット |

共通ステップ: checkout → mise install（Bun）→ 各処理 → `git add docs && git commit && git push`。
Pages は `main:/docs` を自動デプロイ。両ワークフローに `permissions: contents: write` を付ける（push に必須）。
`.cache/` は `.gitignore` に入れてコミットしない。

必要な Secrets: `DEEPL_API_KEY`（または代替 MT のキー）、`CLAUDE_CODE_OAUTH_TOKEN`。
`CLAUDE_CODE_OAUTH_TOKEN` は `claude setup-token` で生成、約 1 年有効・自動更新なし。401 で落ちたら手動で差し替える。

### 既知の運用リスク（再設計不要、症状を認識できるようにするための記録）

- **`GITHUB_TOKEN` による push が Pages のビルドを起動するか → 検証済み・起動する。**
  bot（`github-actions[bot]`）が `docs/` を push すると `pages-build-deployment` が自動で走り
  公開 URL が更新されることを初回運用で確認した。deploy key / `actions/deploy-pages` への
  フォールバックは不要。
- **`claude-code-action` はスケジュール実行に human-actor チェックを適用**し、cron を最後に編集した
  ユーザーに実行を帰属させる。通常は本人なので通るが、通らないとデイリーレポートが止まり、
  症状は「ワークフロー失敗」だけ。初回のスケジュール実行で明示的に確認する。
- **`claude-code-action` は git 認証情報を書き換える**。後続ステップの素の `git push` は
  checkout のトークンを失って認証失敗するため、`daily.yml` の commit ステップは
  `https://x-access-token:${GITHUB_TOKEN}@github.com/...` の明示 URL で push する。

## ディレクトリ構成

```
rss/
  feeds.yaml
  report-criteria.md
  mise.toml            # bun ピン + tasks
  biome.json
  package.json
  tsconfig.json
  src/
    lib/               # フィードパース / yaml ロード / 翻訳クライアント / URL ヘルパ
    translate.ts       # 機能 A エントリ
    report/
      collect.ts       # 過去 24h を .cache/daily-input.json へ
      render.ts        # daily-report.md → docs/daily/*.html + index + daily.xml
    build.ts           # docs/ の組み立て（index, assets）
    import-opml.ts      # OPML → feeds.yaml（ワンショット）
  docs/                # GitHub Pages 配信対象。ワークフローがコミット
    index.html
    translated.xml
    daily.xml
    daily/
    assets/style.css
  .github/workflows/
    translate.yml
    daily.yml
```

mise タスク: `translate` / `report:collect` / `report:render` / `build` / `import:opml` / `serve` / `lint` / `format`。

## スコープ外

- Inoreader API 連携（OAuth・レート制御・secret 書き戻し）。OPML 変換のワンショットのみ残す。
- 記事本文の全文翻訳・転載。タイトルと description のみ翻訳し、本文は Google 翻訳リンクで代替。
- SSG（Astro / Eleventy 等）。`marked` ＋ テンプレートリテラル ＋ RSS 生成ライブラリの最小構成。
- カスタムドメイン。
- 状態管理用の DB / 台帳ファイル。
- 例外処理・リトライの作り込み。失敗は落として通知する方針。

## 初回運用で確認済み

- `translate.yml` / `daily.yml` とも CI で成功。DeepL 翻訳・claude-code-action のキュレーション・
  bot による `docs/` コミット・`pages-build-deployment` の自動起動まで一通り確認。
- 公開先 <https://ogontaro.github.io/rss/>（`translated.xml` / `daily.xml` / `daily/*.html` すべて 200）。

## 残タスク

1. 実フィードリスト（Inoreader OPML）への差し替え。差し替え時に truncate 100 件を再検討。
2. `report-criteria.md` の関心領域を本人の内容に更新。
