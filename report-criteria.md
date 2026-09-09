# デイリーレポートの選定基準

過去24時間の新着エントリ（タイトルと概要は日本語化済み）から、重要なものを **5〜10 件** 選ぶ。

## 重視する軸

1. **関心領域との一致（主）** — 以下に近いものを優先する。購読フィードの傾向に基づく。
   - Platform Engineering / Internal Developer Platform（Backstage、開発者体験）
   - Kubernetes・CNCF エコシステム（Argo, Karpenter, Crossplane, kro, GitOps）
   - AWS（EKS、コンテナ、アーキテクチャ、週刊AWS 級のまとめ）
   - IaC / Terraform、構成管理、CI/CD
   - AI コーディング支援・LLM（Claude / Claude Code、Cursor、AIエディタ、エージェント）
   - 開発生産性・ツール、個人開発
   - 補助的に: OSS のメジャーリリース（dex, dify, DuckDB 等）、国内技術トレンド
2. **話題性・影響度（従）** — その分野で広く参照されそうか、実務や設計判断に効くか。

## 除外するもの

- 単なる求人・宣伝・リリース連絡で、エンジニアリング的な中身がないもの
- 同一トピックの重複（最も情報量が多い1本に絞る）
- 音楽 / アニメ / ゲーム / 車 / ポケモンなど、上記の技術関心と無関係な話題

## 出力フォーマット（`.cache/daily-report.md` に書く）

```
## 今日の N 本

### <日本語タイトル>
<2〜3文の日本語コメント。要約ではなく「なぜ読む価値があるか」を書く。>
[原文を読む](<link>) / [Google 翻訳で全文を読む](https://translate.google.com/translate?sl=auto&tl=ja&u=<URLエンコードした link>)
```

- `category` があれば、それごとに `##` セクションを分けてよい。
- このファイル以外には何も書かない。`docs/` 以下は触らない。
