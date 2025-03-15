import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { html } from 'hono/html';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';
import { routes } from './routes';
import App from './App';

// クライアントサイドのスクリプトパス
const SCRIPT_PATH = '/assets/entry.client.js';
// スタイルシートパス
const STYLE_PATH = '/assets/style.css';

// Fetch Requestをイミュータブルなオブジェクトに変換するヘルパー関数
function createFetchRequest(req: Request) {
  const origin = new URL(req.url).origin;
  const url = new URL(req.url.slice(origin.length), origin);

  return {
    url: url.href,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  };
}

// Honoアプリケーションを作成
const app = new Hono();

// 静的アセットの提供
app.get('/assets/*', serveStatic({ root: './' }));

// すべてのルートでSSRを処理
app.all('*', async (c) => {
  try {
    const { query, dataRoutes } = createStaticHandler(routes);
    const fetchRequest = createFetchRequest(c.req.raw);
    const context = await query(fetchRequest);

    // リダイレクトなどの特殊レスポンスを処理
    if (context instanceof Response) {
      return context;
    }

    // 静的ルーターを作成
    const router = createStaticRouter(dataRoutes, context);

    // コンポーネントをレンダリング
    const appHtml = renderToString(
      <App router={
        <StaticRouterProvider
          router={router}
          context={context}
        />
      } />
    );

    // HTMLをレスポンスとして返す
    return c.html(html`
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Blog | shuymn.me</title>
          <link rel="stylesheet" href="${STYLE_PATH}" />
        </head>
        <body>
          <div id="root">${appHtml}</div>
          <script type="module" src="${SCRIPT_PATH}"></script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Rendering error:', error);
    return c.text('Server Error', 500);
  }
});

export default app;
