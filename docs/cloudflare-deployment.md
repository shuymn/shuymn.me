# Cloudflare デプロイ設計

## 概要

ブログサイトの新しいスタックでは、Cloudflareのサービス群を活用してホスティングとAPIを実装します。具体的には、フロントエンドをCloudflare Workers Assetsに、バックエンドAPIをCloudflare Workersにデプロイします。

## Cloudflareサービス利用計画

### 1. Cloudflare Workers Assets

Reactベースのフロントエンドをホスティングするために使用します。主な特徴：

- Workersと静的アセットを1つのプロジェクトとして管理可能
- 単一のワークフローでSSRとアセット配信が可能
- 静的アセットはリクエスト制限にカウントされない
- グローバルエッジでの高速配信
- カスタマイズ性が高い

### 2. Cloudflare Workers

microCMSと連携するバックエンドAPIを実装するために使用します。主な特徴：

- サーバーレスで運用コストが低い
- グローバルエッジで低レイテンシー
- TypeScriptサポート
- Honoフレームワークとの相性が良い

### 3. Cloudflare KV (Key-Value Store)

APIレスポンスのキャッシュに使用します。主な特徴：

- グローバル分散KVストア
- Workersからの簡単なアクセス
- 低レイテンシー

## デプロイ設定

### Cloudflare Workers Assets設定 (フロントエンド)

```toml
# apps/blog/wrangler.toml
name = "blog-frontend"
main = "dist/server/entry.server.js"
compatibility_date = "2023-10-30"

# 静的アセットの設定
assets = [
  { pattern = "dist/client/**/*", path = "/assets" }
]

# 環境変数設定
[vars]
API_URL = "https://api.shuymn.me"

[env.development]
vars = { API_URL = "http://localhost:8787" }

[env.production]
vars = { API_URL = "https://api.shuymn.me" }

# Custom domain設定
[[routes]]
pattern = "shuymn.me/*"
zone_name = "shuymn.me"
```

### GitHub Actions設定 (フロントエンド)

```yaml
# .github/workflows/deploy-worker-assets.yml
name: Deploy to Cloudflare Workers Assets

on:
  push:
    branches: [main]
    paths:
      - 'apps/blog/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 7
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run --filter=blog build
      - name: Deploy to Cloudflare Workers
        run: pnpm run --filter=blog deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Cloudflare Workers設定 (バックエンド)

```toml
# api/blog/wrangler.toml
name = "blog-api"
main = "src/index.ts"
compatibility_date = "2023-01-01"

# KVストア設定
kv_namespaces = [
  { binding = "BLOG_CACHE", id = "${KV_BLOG_CACHE_ID}", preview_id = "${KV_BLOG_CACHE_PREVIEW_ID}" }
]

[env.production]
# 環境変数
vars = { ENVIRONMENT = "production" }

# カスタムドメイン設定
[env.production.routes]
pattern = "api.shuymn.me/*"
zone_name = "shuymn.me"

[env.staging]
# 環境変数
vars = { ENVIRONMENT = "staging" }
```

```yaml
# .github/workflows/deploy-workers.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
    paths:
      - 'api/blog/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 7
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'pnpm'
      - run: pnpm install
      - name: Deploy to Cloudflare Workers
        run: pnpm run --filter=blog-api deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          KV_BLOG_CACHE_ID: ${{ secrets.KV_BLOG_CACHE_ID }}
          KV_BLOG_CACHE_PREVIEW_ID: ${{ secrets.KV_BLOG_CACHE_PREVIEW_ID }}
```

## ドメイン設定

新しいブログサイトは以下のドメイン構成で運用します：

- フロントエンド: `shuymn.me`（メインドメイン）
- API: `api.shuymn.me`（サブドメイン）

DNSレコード設定：

```
shuymn.me.            CNAME    <Cloudflare-Workers-URL>
api.shuymn.me.        CNAME    <Cloudflare-Workers-URL>
```

## キャッシュ戦略

### Cloudflare Workers KVを使用したAPIキャッシュ

```typescript
// api/blog/src/middlewares/cache.ts
import { Middleware } from 'hono';

declare global {
  const BLOG_CACHE: KVNamespace;
}

export const cacheMiddleware = (options: {
  ttl?: number;
}): Middleware => {
  const ttl = options.ttl || 60 * 5; // デフォルト5分

  return async (c, next) => {
    const url = c.req.url;
    const cacheKey = `cache:${url}`;
    
    // キャッシュからデータ取得を試みる
    const cachedData = await BLOG_CACHE.get(cacheKey, 'json');
    if (cachedData) {
      return c.json(cachedData);
    }
    
    // キャッシュがなければ次のミドルウェアへ
    await next();
    
    // レスポンスをキャッシュ
    if (c.res.status === 200) {
      const data = await c.res.json();
      await BLOG_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: ttl });
      return c.json(data);
    }
  };
};
```

### フロントエンドのReact Router設定

フロントエンドでは、React Router v7のサーバーサイドレンダリング機能とローダーを使用してデータ取得とキャッシュを管理します。

```typescript
// apps/blog/src/routes.tsx
import { RouteObject } from 'react-router-dom';
import RootLayout from './routes/RootLayout';
import Home from './routes/Home';
import Post from './routes/Post';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          const response = await fetch(`${API_URL}/api/posts`);
          if (!response.ok) {
            throw new Response('記事一覧の取得に失敗しました', { status: response.status });
          }
          return response.json();
        },
      },
      {
        path: 'posts/:slug',
        element: <Post />,
        loader: async ({ params }) => {
          const response = await fetch(`${API_URL}/api/posts/${params.slug}`);
          if (!response.ok) {
            throw new Response('記事が見つかりませんでした', { status: 404 });
          }
          return response.json();
        },
      },
    ],
  },
];
```

## セキュリティ設定

### CORS設定

```typescript
// api/blog/src/middlewares/cors.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export const corsMiddleware = (app: Hono) => {
  app.use('*', cors({
    origin: ['https://shuymn.me', 'http://localhost:3000'],
    allowMethods: ['GET', 'OPTIONS'],
    maxAge: 86400, // 1日
  }));
};
```

### Content Security Policy

```typescript
// apps/blog/src/entry.server.tsx内で設定
// HTMLレスポンス生成時にCSPヘッダーを設定
return c.html(html`
  <!DOCTYPE html>
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; img-src 'self' https://images.microcms-assets.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.shuymn.me;" />
      <title>Blog | shuymn.me</title>
      <link rel="stylesheet" href="${STYLE_PATH}" />
    </head>
    <body>
      <div id="root">${appHtml}</div>
      <script type="module" src="${SCRIPT_PATH}"></script>
    </body>
  </html>
`);
```

## 監視とエラーハンドリング

### Cloudflare Analyticsの設定

Cloudflare Dashboardで以下を設定：

1. Web Analyticsの有効化
2. APIレスポンスタイムの監視
3. エラーレートのアラート設定

### フロントエンドエラー処理

```typescript
// React Routerのエラーハンドリング
// apps/blog/src/routes/NotFound.tsx
import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

export default function NotFound() {
  const error = useRouteError() as any;
  const status = error?.status || 404;
  const message = error?.statusText || error?.message || 'ページが見つかりませんでした';
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold mb-4">エラー {status}</h1>
      <p className="text-xl text-gray-600 mb-8">{message}</p>
      <Link to="/" className="text-blue-600 hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
```

## パフォーマンス最適化

### Cloudflare設定

Cloudflare Dashboardで以下を設定：

1. Auto Minifyの有効化（HTML, CSS, JavaScript）
2. Brotli圧縮の有効化
3. Workers KVでのキャッシュの活用

### フロントエンド最適化

- バンドルサイズの最適化（Code Splitting）
- 画像最適化
- SSRとクライアントサイドハイドレーション
- 遅延ローディングの活用

## デプロイワークフロー

1. 開発者がコードをGitHubにプッシュ
2. GitHub Actionsが自動的にビルドを実行
3. ビルド成功後、フロントエンドをCloudflare Workers Assetsに、バックエンドをCloudflare Workersに自動デプロイ
4. デプロイ後、自動テストを実行（オプション）

## 移行プロセス

1. Cloudflareアカウントの設定
   - アカウント作成
   - APIトークンの発行
   - ドメインの追加と検証

2. KVネームスペースの作成
   - `BLOG_CACHE`ネームスペースを作成
   - 本番用とプレビュー用のIDを取得
   - 環境変数に設定

3. Workersプロジェクトの作成
   - Wranglerを使用してプロジェクト初期化
   - microCMS連携コードの実装
   - キャッシュミドルウェアの実装
   - デプロイ設定の構成

4. Workers Assetsプロジェクトの作成
   - React Router v7を使ったSSRフロントエンドの実装
   - Wrangler設定ファイルでアセット設定
   - ビルド設定の構成

5. CI/CDパイプラインの設定
   - GitHub Secrets設定
   - GitHub ActionsワークフローYAMLの作成

6. DNSレコードの設定
   - Cloudflareのネームサーバー設定
   - サブドメインレコードの追加

7. テストとデバッグ
   - ローカル環境での動作確認
   - ステージング環境でのテスト
   - 本番環境での小規模テスト

8. 完全移行
   - DNSの完全切り替え
   - 旧サイトからのリダイレクト設定

## コスト見積り

Cloudflareの無料枠を利用する場合：

- Cloudflare Workers: 無料枠（1日100,000リクエスト）
- Cloudflare Workers Assets: Workers無料枠に含まれる
- Cloudflare KV: 無料枠（1,000ペア、1日100,000読み取り、1日1,000書き込み）

個人ブログの一般的なトラフィックであれば、無料枠内で運用可能です。

## 利点とメリット

1. **統合管理**: 静的アセットとサーバーサイドロジックを一元管理
2. **グローバルパフォーマンス**: Cloudflareのグローバルエッジネットワークによる高速レスポンス
3. **低コスト**: 小〜中規模サイトなら無料枠内で運用可能
4. **スケーラビリティ**: トラフィック増加時も自動スケール
5. **セキュリティ**: DDoS保護、WAF機能などCloudflareのセキュリティ機能
6. **柔軟性**: より柔軟なカスタマイズが可能

## 課題と対策

1. **無料枠制限**: 将来的にトラフィックが増加した場合は有料プランへのアップグレードが必要
2. **ベンダーロックイン**: Cloudflare固有の機能への依存を最小化し、コアロジックを分離
3. **デバッグ難易度**: サーバーレス環境のデバッグは複雑になるため、ロギングとモニタリングを充実させる
