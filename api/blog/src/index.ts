import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import postsController from './controllers/posts';
import tagsController from './controllers/tags';

// APIアプリケーションを作成
const app = new Hono();

// ミドルウェア
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'https://shuymn.me', 'https://www.shuymn.me'],
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// ルート
app.get('/', (c) => c.json({ message: 'Welcome to Blog API', version: '1.0.0' }));

// API v1 ルーター
const v1 = new Hono().basePath('/v1');
v1.route('/posts', postsController);
v1.route('/tags', tagsController);

// API v1をマウント
app.route('', v1);

// エラーハンドリング
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`, err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      message: 'Internal Server Error',
      error: process.env.ENVIRONMENT === 'development' ? err.message : undefined,
    },
    500
  );
});

// 404 Not Found
app.notFound((c) => {
  return c.json({ message: 'Not Found', status: 404 }, 404);
});

export default app;
