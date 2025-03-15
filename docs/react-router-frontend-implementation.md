# React Router フロントエンド実装計画

## 概要

React RouterとTailwindCSSを使用して、新しいブログフロントエンドを実装します。APIからのデータ取得にはHono APIを使用し、UIはシンプルでモダンなデザインを目指します。

## ディレクトリ構造

```
/apps/blog/
├── public/               # 静的アセット
│   ├── favicon.ico
│   └── default_og_image.jpg
├── src/
│   ├── components/       # UIコンポーネント
│   │   ├── layout/       # レイアウト関連
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── articles/     # 記事関連
│   │   │   ├── ArticleList.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleDetail.tsx
│   │   │   └── ArticleMeta.tsx
│   │   └── ui/           # 共通UI
│   │       ├── Button.tsx
│   │       ├── Spinner.tsx
│   │       └── ErrorMessage.tsx
│   ├── routes/           # ルート定義
│   │   ├── root.tsx      # ルートレイアウト
│   │   ├── home.tsx      # ホームページ
│   │   ├── article.tsx   # 記事詳細ページ
│   │   └── index.tsx     # ルーター設定
│   ├── lib/              # ユーティリティ
│   │   ├── api.ts        # APIクライアント
│   │   ├── date.ts       # 日付ユーティリティ
│   │   └── metadata.ts   # メタデータユーティリティ
│   ├── hooks/            # カスタムフック
│   │   ├── useArticles.ts
│   │   └── useArticle.ts
│   ├── types/            # 型定義
│   │   └── api.ts
│   ├── styles/           # スタイル
│   │   └── global.css
│   ├── main.tsx          # エントリーポイント
│   └── App.tsx           # アプリケーションコンポーネント
├── index.html
├── vite.config.ts        # Vite設定
├── postcss.config.js     # PostCSS設定
├── tailwind.config.js    # Tailwind設定
└── package.json          # 依存関係
```

## 実装詳細

### 1. Viteプロジェクトセットアップ

```bash
# プロジェクト初期化
pnpm create vite apps/blog --template react-ts

# 依存関係インストール
cd apps/blog
pnpm add react-router-dom tailwindcss postcss autoprefixer
pnpm add -D @types/react-router-dom
```

### 2. TailwindCSSセットアップ

```bash
# Tailwind初期化
pnpm exec tailwindcss init -p
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold mb-4;
  }
  
  h1 {
    @apply text-3xl md:text-4xl;
  }
  
  h2 {
    @apply text-2xl md:text-3xl;
  }
  
  a {
    @apply text-blue-600 hover:text-blue-800;
  }
}
```

### 3. React Routerセットアップ

```typescript
// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import Root from './root';
import Home from './home';
import Article from './article';
import ErrorPage from '../components/ui/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'articles/:slug',
        element: <Article />,
      },
    ],
  },
]);
```

```typescript
// src/routes/root.tsx
import { Outlet } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

export default function Root() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
```

### 4. APIクライアント実装

```typescript
// src/types/api.ts
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
```

```typescript
// src/lib/api.ts
import { Article, ArticlesResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.shuymn.me';

// 記事一覧取得
export async function getArticles(params?: {
  limit?: number;
  offset?: number;
  filters?: string;
}): Promise<ArticlesResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset) {
    queryParams.append('offset', params.offset.toString());
  }
  
  if (params?.filters) {
    queryParams.append('filters', params.filters);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/articles${queryString}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }
  
  return response.json();
}

// 記事詳細取得
export async function getArticle(slug: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/api/articles/${slug}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${slug}`);
  }
  
  return response.json();
}
```

### 5. カスタムフック実装

```typescript
// src/hooks/useArticles.ts
import { useQuery } from '@tanstack/react-query';
import { getArticles } from '../lib/api';

export function useArticles(params?: {
  limit?: number;
  offset?: number;
  filters?: string;
}) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => getArticles(params),
  });
}
```

```typescript
// src/hooks/useArticle.ts
import { useQuery } from '@tanstack/react-query';
import { getArticle } from '../lib/api';

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticle(slug),
    enabled: !!slug,
  });
}
```

### 6. コンポーネント実装

```typescript
// src/components/layout/Layout.tsx
import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

```typescript
// src/components/layout/Header.tsx
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900 no-underline">
          shuymn.me
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a
                href="https://google.com/search?q=site:shuymn.me"
                className="text-gray-700 hover:text-gray-900 no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Search
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

### 7. ページコンポーネント実装

```typescript
// src/routes/home.tsx
import { useArticles } from '../hooks/useArticles';
import { ArticleList } from '../components/articles/ArticleList';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export default function Home() {
  const { data, isLoading, error } = useArticles({ limit: 10 });
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error) {
    return <ErrorMessage message="記事の取得に失敗しました。" />;
  }
  
  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">shuymn.me</h1>
        <div className="prose">
          <p>
            日常的なことやプログラミングに関する個人的な記事を投稿しています。
          </p>
          <p>投稿は全て個人の意見であり、所属する組織の意見ではありません。</p>
        </div>
        <div className="mt-4 flex space-x-2">
          <a
            href="https://twitter.com/shuymn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
          <span>/</span>
          <a
            href="https://github.com/shuymn"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span>/</span>
          <a href="mailto:mail@shuymn.me">mail</a>
        </div>
      </section>
      
      <section>
        <ArticleList articles={data?.contents || []} />
      </section>
    </div>
  );
}
```

```typescript
// src/routes/article.tsx
import { useParams } from 'react-router-dom';
import { useArticle } from '../hooks/useArticle';
import { ArticleDetail } from '../components/articles/ArticleDetail';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useArticle(slug || '');
  
  if (isLoading) {
    return <Spinner />;
  }
  
  if (error || !data) {
    return <ErrorMessage message="記事の取得に失敗しました。" />;
  }
  
  return <ArticleDetail article={data} />;
}
```

### 8. 記事コンポーネント実装

```typescript
// src/components/articles/ArticleList.tsx
import { Link } from 'react-router-dom';
import { Article } from '../../types/api';
import { formatDate } from '../../lib/date';

type ArticleListProps = {
  articles: Omit<Article, 'content'>[];
};

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return <p>記事がありません。</p>;
  }
  
  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <div key={article.id} className="mb-6">
          <p className="text-sm text-gray-600">
            {formatDate(article.publishedAt)}
          </p>
          <Link
            to={`/articles/${article.slug}`}
            className="text-xl font-medium no-underline hover:underline"
          >
            {article.title}
          </Link>
        </div>
      ))}
    </div>
  );
}
```

```typescript
// src/components/articles/ArticleDetail.tsx
import { Helmet } from 'react-helmet-async';
import { Article } from '../../types/api';
import { formatDate } from '../../lib/date';

type ArticleDetailProps = {
  article: Article;
};

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <>
      <Helmet>
        <title>{article.title} | shuymn.me</title>
        <meta name="description" content={article.description} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        {article.eyecatch && (
          <meta property="og:image" content={article.eyecatch.url} />
        )}
      </Helmet>
      
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <p className="text-gray-600 mb-2">
            {formatDate(article.publishedAt)}
          </p>
          <h1 className="text-3xl font-bold">{article.title}</h1>
        </header>
        
        <div
          className="prose lg:prose-lg mx-auto"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </>
  );
}
```

### 9. アプリケーションエントリーポイント

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <RouterProvider router={router} />
      </HelmetProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

## 依存関係

```json
{
  "name": "blog",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@tanstack/react-query": "^4.20.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-helmet-async": "^1.3.0",
    "react-router-dom": "^6.8.0",
    "tailwindcss": "^3.2.4"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.9",
    "@types/react": "^18.0.27",
    "@types/react-dom": "^18.0.10",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^3.1.0",
    "autoprefixer": "^10.4.13",
    "postcss": "^8.4.21",
    "typescript": "^4.9.5",
    "vite": "^4.1.0"
  }
}
```

## 実装ステップ

1. Viteプロジェクトの初期化とパッケージインストール
2. TailwindCSSの設定
3. React Routerの設定
4. コンポーネント実装：レイアウト関連
5. APIクライアントとカスタムフック実装
6. コンポーネント実装：記事一覧・詳細
7. ページコンポーネント実装
8. スタイリングの調整
9. SEO対策（Helmet）

## デプロイ設定

```yaml
# .github/workflows/deploy.yml
name: Deploy

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

## 課題と対策

### 1. パフォーマンス最適化

- Viteによる高速ビルド・開発体験
- React QueryによるデータキャッシュとAPI呼び出し最適化
- 画像最適化（WebP形式、サイズ調整）
- コード分割とレイジーローディング

### 2. SEO対策

- Helmet による適切なメタデータ提供
- 適切なHTMLセマンティクス
- OGP対応

### 3. アクセシビリティ

- セマンティックHTML
- 適切なコントラスト比
- キーボード操作のサポート
