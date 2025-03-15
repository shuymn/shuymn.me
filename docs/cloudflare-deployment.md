# Cloudflare デプロイ設計

## 概要

ブログサイトの新しいスタックでは、Cloudflareのサービス群を活用してホスティングとAPIを実装します。具体的には、フロントエンドをCloudflare Pagesに、バックエンドAPIをCloudflare Workersにデプロイします。

## Cloudflareサービス利用計画

### 1. Cloudflare Pages

ReactベースのSPAをホスティングするために使用します。主な特徴：

- 無料枠があり、個人ブログには十分
- 自動ビルド・デプロイ機能（GitHub連携）
- グローバルCDN
- カスタムドメイン対応
- SSL対応

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

### Cloudflare Pages設定

```toml
# .cloudflare/pages.toml
[build]
command = "cd ../.. && pnpm run --filter=blog build"
output_directory = "dist"

[site]
bucket = "./dist"
entry-point = "."

[env.production]
VITE_API_BASE_URL = "https://api.shuymn.me"
```

### GitHub Actions設定

```yaml
# .github/workflows/deploy-pages.yml
name: Deploy to Cloudflare Pages

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
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: blog
          directory: apps/blog/dist
```

### Cloudflare Workers設定

```toml
# api/blog/wrangler.toml
name = "blog-api"
main = "src/index.ts"
compatibility_date = "2023-01-01"

# KVストア設定
kv_namespaces = [
  { binding = "BLOG_CACHE", id = "xxxx", preview_id = "xxxx" }
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
```

## ドメイン設定

新しいブログサイトは以下のドメイン構成で運用します：

- フロントエンド: `shuymn.me`（メインドメイン）
- API: `api.shuymn.me`（サブドメイン）

DNSレコード設定：

```
shuymn.me.            CNAME    <Cloudflare-Pages-URL>
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

### フロントエンドのTanstack Query設定

```typescript
// apps/blog/src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間のキャッシュ
      cacheTime: 1000 * 60 * 30, // 30分間のキャッシュ保持
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
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
// apps/blog/src/routes/root.tsx
import { Helmet } from 'react-helmet-async';

export default function Root() {
  return (
    <>
      <Helmet>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; img-src 'self' https://images.microcms-assets.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.shuymn.me;" />
      </Helmet>
      {/* ... */}
    </>
  );
}
```

## 監視とエラーハンドリング

### Cloudflare Analyticsの設定

Cloudflare Dashboardで以下を設定：

1. Web Analyticsの有効化
2. APIレスポンスタイムの監視
3. エラーレートのアラート設定

### フロントエンドエラー処理

```typescript
// apps/blog/src/components/ui/ErrorBoundary.tsx
import React, { ErrorInfo, Component } from 'react';
import { ErrorPage } from './ErrorPage';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // ここにエラー追跡サービスへの送信コードを追加可能
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## パフォーマンス最適化

### Cloudflare設定

Cloudflare Dashboardで以下を設定：

1. Auto Minifyの有効化（HTML, CSS, JavaScript）
2. Brotli圧縮の有効化
3. キャッシュルールの設定
   - 静的アセット: 1週間キャッシュ
   - API応答: 5分キャッシュ

### フロントエンド最適化

- 画像最適化（WebP形式使用）
- コード分割
- 遅延ローディング

## デプロイワークフロー

1. 開発者がコードをGitHubにプッシュ
2. GitHub Actionsが自動的にビルドを実行
3. ビルド成功後、Cloudflare PagesとCloudflare Workersに自動デプロイ
4. デプロイ後、自動テストを実行（オプション）

## 移行プロセス

1. Cloudflareアカウントの設定
   - アカウント作成
   - APIトークンの発行
   - ドメインの追加と検証

2. KVネームスペースの作成
   - `BLOG_CACHE`ネームスペースを作成
   - 本番用とプレビュー用のIDを取得

3. Workersプロジェクトの作成
   - Wranglerを使用してプロジェクト初期化
   - microCMS連携コードの実装
   - キャッシュミドルウェアの実装
   - デプロイ設定の構成

4. Pagesプロジェクトの作成
   - GitHubリポジトリの連携
   - ビルド設定の構成
   - 環境変数の設定

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

- Cloudflare Pages: 無料枠（月間500ビルド、帯域制限なし）
- Cloudflare Workers: 無料枠（1日100,000リクエスト）
- Cloudflare KV: 無料枠（1,000ペア、1日100,000読み取り、1日1,000書き込み）

個人ブログの一般的なトラフィックであれば、無料枠内で運用可能です。

## 利点とメリット

1. **グローバルパフォーマンス**: Cloudflareのグローバルエッジネットワークによる高速レスポンス
2. **低コスト**: 小〜中規模サイトなら無料枠内で運用可能
3. **スケーラビリティ**: トラフィック増加時も自動スケール
4. **セキュリティ**: DDoS保護、WAF機能などCloudflareのセキュリティ機能
5. **開発効率**: GitHub連携による簡単なCI/CD

## 課題と対策

1. **無料枠制限**: 将来的にトラフィックが増加した場合は有料プランへのアップグレードが必要
2. **ベンダーロックイン**: Cloudflare固有の機能への依存を最小化し、コアロジックを分離
3. **デバッグ難易度**: サーバーレス環境のデバッグは複雑になるため、ロギングとモニタリングを充実させる
