# Hono バックエンド実装計画

## 概要

Cloudflare Workersで動作するHonoフレームワークを使用して、microCMSのコンテンツを取得・提供するバックエンドAPIを実装します。

## ディレクトリ構造

```
/api/blog/
├── src/
│   ├── index.ts             # Honoアプリケーションのエントリーポイント
│   ├── routes/              # APIルート定義
│   │   ├── articles.ts      # 記事関連API
│   │   └── index.ts         # ルートAPI
│   ├── services/            # ビジネスロジック
│   │   └── microcms.ts      # microCMSクライアント
│   ├── middlewares/         # Honoミドルウェア
│   │   ├── cache.ts         # キャッシュミドルウェア
│   │   ├── error.ts         # エラーハンドリングミドルウェア
│   │   └── cors.ts          # CORSミドルウェア
│   └── types/               # 型定義
│       └── api.ts           # API関連の型定義
├── wrangler.toml            # Cloudflare Workers設定
└── package.json             # 依存関係
```

## 実装詳細

### 1. Honoアプリケーションのセットアップ

```typescript
// api/blog/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { logger } from 'hono/logger';
import { errorHandler } from './middlewares/error';
import { articlesRouter } from './routes/articles';

// アプリケーション作成
const app = new Hono();

// ミドルウェア
app.use('*', logger());
app.use('*', cors());
app.use('*', errorHandler());
app.use('*', cache({
  cacheName: 'blog-api',
  cacheControl: 'max-age=3600', // 1時間
}));

// ルート設定
app.get('/', (c) => {
  return c.json({
    message: 'Blog API is working',
    version: '1.0.0',
  });
});

// ルーター
app.route('/api/articles', articlesRouter);

export default app;
```

### 2. microCMSクライアントの実装

```typescript
// api/blog/src/services/microcms.ts
import { createClient } from 'microcms-js-sdk';

// 型定義
export type Article = {
  id: string;
  title: string;
  content: string;
  description: string;
  slug: string;
  publishedAt: string;
  revisedAt?: string;
  eyecatch?: {
    url: string;
    width: number;
    height: number;
  };
  tags?: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export type ArticlesResponse = {
  contents: Omit<Article, 'content'>[];
  totalCount: number;
  limit: number;
  offset: number;
};

// クライアント初期化
export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN || '',
  apiKey: process.env.MICROCMS_API_KEY || '',
});

// 記事一覧取得
export async function getArticles(queries?: any): Promise<ArticlesResponse> {
  const data = await client.get({
    endpoint: 'articles',
    queries: {
      fields: 'id,title,slug,description,publishedAt,revisedAt,eyecatch,tags',
      ...queries,
    },
  });
  return data;
}

// 記事詳細取得（スラッグ指定）
export async function getArticleBySlug(slug: string): Promise<Article> {
  const data = await client.get({
    endpoint: 'articles',
    queries: {
      filters: `slug[equals]${slug}`,
    },
  });
  
  if (!data.contents.length) {
    throw new Error(`Article not found: ${slug}`);
  }
  
  return data.contents[0];
}

// 記事詳細取得（ID指定）
export async function getArticleById(id: string): Promise<Article> {
  const data = await client.get({
    endpoint: `articles/${id}`,
  });
  return data;
}
```

### 3. 記事APIルーターの実装

```typescript
// api/blog/src/routes/articles.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getArticles, getArticleBySlug } from '../services/microcms';

// バリデーションスキーマ
const listQuerySchema = z.object({
  limit: z.string().optional().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  offset: z.string().optional().transform(Number).pipe(z.number().min(0)).default('0'),
  filters: z.string().optional(),
});

// ルーター作成
export const articlesRouter = new Hono();

// 記事一覧取得API
articlesRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { limit, offset, filters } = c.req.valid('query');
  
  try {
    const articles = await getArticles({
      limit,
      offset,
      filters,
    });
    
    return c.json(articles);
  } catch (error) {
    c.status(500);
    return c.json({ error: 'Failed to fetch articles' });
  }
});

// 記事詳細取得API
articlesRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  try {
    const article = await getArticleBySlug(slug);
    return c.json(article);
  } catch (error) {
    c.status(404);
    return c.json({ error: 'Article not found' });
  }
});
```

### 4. Cloudflare Workers設定

```toml
# api/blog/wrangler.toml
name = "blog-api"
main = "src/index.ts"
compatibility_date = "2023-01-01"

[vars]
MICROCMS_SERVICE_DOMAIN = ""
MICROCMS_API_KEY = ""

[[routes]]
pattern = "api.shuymn.me/*"
zone_name = "shuymn.me"
```

## 依存関係

```json
{
  "name": "blog-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev src/index.ts",
    "build": "wrangler build",
    "deploy": "wrangler publish",
    "lint": "eslint .",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "hono": "^3.0.0",
    "microcms-js-sdk": "^2.0.0",
    "@hono/zod-validator": "^0.1.2",
    "zod": "^3.20.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

## 実装ステップ

1. Cloudflareアカウント設定とAPI Tokenの取得
2. Honoプロジェクトの初期化
3. microCMSクライアントの実装
4. APIルートの実装
5. ミドルウェアの実装
6. Cloudflare Workersへのデプロイ
7. 動作確認とテスト

## 課題と対策

### パフォーマンス最適化

- Cloudflareのキャッシュ機能を活用して応答時間を短縮
- 必要なフィールドのみを取得するためのクエリパラメータの活用

### セキュリティ対策

- CORS設定の適切な構成
- レート制限の設定

### エラーハンドリング

- 統一的なエラー応答形式
- 適切なHTTPステータスコードの使用
