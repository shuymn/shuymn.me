import { Hono } from 'hono';
import { renderer } from './renderer';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

// 静的アセットの処理
app.use('/assets/*', serveStatic({ root: './' }));
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }));

// すべてのルートを React Router で処理
app.get('*', renderer);

export default app;
