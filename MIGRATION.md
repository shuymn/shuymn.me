# React Router/TailwindCSS/Hono/Cloudflare/microCMSへの移行計画

## 1. 目的

Next.jsで構築された現在のブログサイトを、より効率的で現代的なスタックへ移行します。

- **現状**: Next.js + Markdownファイル + Vercelデプロイ
- **目標**: React Router + TailwindCSS + Hono + Cloudflare + microCMS

## 2. モノレポ構造

```
/
├── apps/
│   ├── oldblog/            # 既存のNext.jsアプリ（現状維持）
│   └── blog/               # 新規React Routerベースのフロントエンド
│
├── packages/
│   ├── ui/                 # 共有UIコンポーネント
│   ├── eslint-config/      # 共有ESLint設定
│   └── tsconfig/           # 共有TypeScript設定
│
└── api/
    └── blog/               # HonoベースのバックエンドAPI
```

## 3. 移行フェーズ

### フェーズ1: 基盤準備（1週間）

- [x] モノレポ構造の構築
- [x] pnpmへの移行
- [x] 共有設定パッケージの作成
- [ ] microCMSアカウント設定
- [ ] Cloudflareアカウント設定

### フェーズ2: バックエンド実装（2週間）

- [ ] microCMSスキーマ設計
- [ ] 既存コンテンツのmicroCMSへの移行スクリプト作成
- [ ] Hono APIの基本実装
  - [ ] 記事一覧取得API
  - [ ] 記事詳細取得API
- [ ] Cloudflare Workersデプロイ設定

### フェーズ3: フロントエンド実装（2週間）

- [ ] React Router構成
- [ ] TailwindCSS設定
- [ ] 共通コンポーネント実装
  - [ ] レイアウト
  - [ ] ヘッダー
  - [ ] 記事リスト
  - [ ] 記事詳細
- [ ] APIクライアント実装

### フェーズ4: デプロイと検証（1週間）

- [ ] Cloudflare Pagesデプロイ設定
- [ ] パフォーマンステスト
- [ ] SEO確認
- [ ] クロスブラウザテスト

### フェーズ5: 切り替え（1日）

- [ ] DNS切り替え
- [ ] リダイレクト設定

## 4. 技術スタック詳細

### フロントエンド

- **フレームワーク**: React + React Router
- **スタイリング**: TailwindCSS
- **ビルドツール**: Vite
- **言語**: TypeScript

### バックエンド

- **フレームワーク**: Hono
- **ホスティング**: Cloudflare Workers
- **CMS**: microCMS
- **言語**: TypeScript

### インフラ

- **CI/CD**: GitHub Actions
- **ホスティング**: Cloudflare Pages
- **パッケージマネージャ**: pnpm
- **モノレポツール**: Turborepo

## 5. 移行リスクと対策

### リスク1: SEOの低下

- **対策**: 
  - 既存のURLパターンの維持
  - 適切なリダイレクト設定
  - メタデータの完全な移行

### リスク2: パフォーマンスの低下

- **対策**:
  - Cloudflareのエッジネットワーク活用
  - バンドルサイズの最適化
  - アセットの最適化

### リスク3: 移行中の機能停止

- **対策**:
  - 段階的移行アプローチ
  - 本番環境切り替え前の十分なテスト

## 6. テスト計画

- Lighthouse スコア測定
- Web Vitals モニタリング
- クロスブラウザテスト
- モバイル対応検証

## 7. ロールバック計画

- DNS設定変更で即時ロールバック可能
- 既存Next.jsアプリは維持
