import { Hono } from 'hono';
import { html } from 'hono/html';
import type { Context } from 'hono';
import { renderToString } from 'react-dom/server';
import { 
  StaticRouterProvider, 
  createStaticHandler, 
  createStaticRouter 
} from 'react-router-dom/server';

import { routes } from './routes';

/**
 * リクエストをReact Router用のフェッチリクエストに変換する
 */
function createFetchRequest(req: Request) {
  const origin = new URL(req.url).origin;
  const url = new URL(req.url.slice(origin.length), origin);

  return {
    url: url.href,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  };
}

/**
 * Reactコンポーネントをレンダリングするミドルウェア
 */
export async function renderer(c: Context) {
  try {
    // 静的ハンドラを作成
    const { query, dataRoutes } = createStaticHandler(routes);
    
    // リクエストを変換
    const fetchRequest = createFetchRequest(c.req.raw);
    
    // データ取得を実行
    const context = await query(fetchRequest);

    // リダイレクトなどの特殊レスポンスを処理
    if (context instanceof Response) {
      return context;
    }

    // 静的ルーターを作成
    const router = createStaticRouter(dataRoutes, context);

    // コンポーネントをレンダリング
    const appHtml = renderToString(
      <StaticRouterProvider router={router} context={context} />
    );

    // HTMLをレスポンスとして返す
    return c.html(html`
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="description" content="shuymn's personal blog" />
          <link rel="icon" href="/favicon.ico" />
          <title>shuymn.me</title>
          <link rel="stylesheet" href="/assets/style.css" />
          <script type="module" src="/assets/entry.client.js" defer></script>
        </head>
        <body>
          <div id="root">${appHtml}</div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Rendering error:', error);
    return c.text('Server Error', 500);
  }
}
