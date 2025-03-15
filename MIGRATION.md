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
│   ├── biome-config/       # 共有Biome設定
│   └── tsconfig/           # 共有TypeScript設定
│
├── api/
│   └── blog/               # HonoベースのバックエンドAPI
│
└── docs/                   # ドキュメント
    ├── cloudflare/         # Cloudflare関連のドキュメント
    ├── hono/               # Hono関連のドキュメント
    ├── react-router/       # React Router関連のドキュメント
    ├── cloudflare-deployment.md           # Cloudflareデプロイ手順
    ├── hono-backend-implementation.md     # バックエンド実装ガイド
    ├── microcms-implementation.md         # microCMS設定・使用方法
    ├── pnpm-migration.md                  # pnpm移行手順
    └── react-router-frontend-implementation.md  # フロントエンド実装ガイド
```

## 3. 移行フェーズ

### フェーズ1: 基盤準備（1週間）

- [x] モノレポ構造の構築
- [x] pnpmへの移行
- [x] 共有設定パッケージの作成
- [x] microCMSアカウント設定
- [x] Cloudflareアカウント設定

### フェーズ2: バックエンド実装（2週間）

- [x] microCMSスキーマ設計
- [x] Hono APIの基本実装
  - [x] 記事一覧取得API
  - [x] 記事詳細取得API
  - [x] タグ関連API
- [ ] Cloudflare Workersデプロイ設定

### フェーズ3: フロントエンド実装（2週間）

- [x] React Router構成
- [x] TailwindCSS設定
- [x] 共通コンポーネント実装
  - [x] レイアウト
  - [x] ヘッダー
  - [x] 記事リスト
  - [x] 記事詳細
- [x] APIクライアント実装

### フェーズ4: デプロイと検証（1週間）

- [ ] microCMSへの既存コンテンツ移行
- [ ] Cloudflare Workers/Workers Assetsデプロイ設定
- [ ] パフォーマンステスト
- [ ] SEO確認
- [ ] クロスブラウザテスト

## 4. 技術スタック詳細

### フロントエンド

- **フレームワーク**: React + React Router
- **ホスティング**: Cloudflare Workers Assets
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
- **ホスティング**: Cloudflare Workers
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

## 7. 実装済みの機能

### バックエンド実装
- [x] microCMSスキーマ設計（Post, Tagモデル）
- [x] Hono APIの基本実装
  - [x] 記事一覧取得API
  - [x] 記事詳細取得API
  - [x] タグ一覧取得API
  - [x] タグ詳細取得API
  - [x] タグに紐づく記事一覧取得API
- [x] API検証とエラーハンドリング
- [x] キャッシュ管理（KVストア設定）

### フロントエンド実装
- [x] React Router構成
- [x] TailwindCSS設定
- [x] 共通コンポーネント実装
  - [x] レイアウト
  - [x] ヘッダー
  - [x] 記事リスト
  - [x] 記事詳細
  - [x] 404ページ
- [x] APIクライアント実装
- [x] SSR対応（Hono + React Router）

## 8. 残りのタスク

### 優先度高
- [ ] microCMSの実際のスキーマ作成
- [ ] テストデータ入力
- [ ] APIテスト
- [ ] Cloudflareへのデプロイ設定
- [ ] 既存記事のmicroCMSへの移行スクリプト作成

### 優先度中
- [ ] SEO対策（metaタグ、OGP設定）
- [ ] パフォーマンス最適化
- [ ] クロスブラウザテスト

### 優先度低
- [ ] GitHub Actionsによる自動デプロイ設定
- [ ] コード品質向上（テスト追加）
