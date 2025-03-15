import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { HTTPException } from 'hono/http-exception';

import { getPost, getPostBySlug, getPosts, getPostsByTag } from '../client/microcms';
import { cacheControl } from '../middlewares/cache-control';
import { getPostSchema, getPostsByTagSchema, getPostsSchema } from '../schemas/validators';

const posts = new Hono();

// 記事一覧を取得
posts.get('/', zValidator('query', getPostsSchema), cacheControl({ maxAge: 60 }), cache({
  cacheName: 'BLOG_CACHE',
  cacheControl: 'max-age=60, s-maxage=120',
}), async (c) => {
  try {
    const queries = c.req.valid('query');
    const response = await getPosts(queries);
    return c.json(response);
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new HTTPException(500, { message: 'Failed to fetch posts' });
  }
});

// タグに紐づく記事一覧を取得 - 順序が重要：これを/:slugより先に定義
posts.get('/tag/:tagId', zValidator('param', getPostsByTagSchema), cacheControl({ maxAge: 300 }), cache({
  cacheName: 'BLOG_CACHE',
  cacheControl: 'max-age=300, s-maxage=600',
}), async (c) => {
  try {
    const { tagId } = c.req.valid('param');
    const queries = c.req.valid('query');
    const response = await getPostsByTag(tagId, queries);
    return c.json(response);
  } catch (error) {
    console.error(`Error fetching posts for tag '${c.req.param('tagId')}':`, error);
    throw new HTTPException(500, { message: 'Failed to fetch posts by tag' });
  }
});

// 特定の記事をslugで取得
posts.get('/:slug', zValidator('param', getPostSchema), cacheControl({ maxAge: 3600 }), cache({
  cacheName: 'BLOG_CACHE',
  cacheControl: 'max-age=3600, s-maxage=7200',
}), async (c) => {
  try {
    const { slug } = c.req.valid('param');
    const queries = c.req.query();
    const post = await getPostBySlug(slug, { fields: queries.fields });
    return c.json(post);
  } catch (error) {
    console.error(`Error fetching post with slug '${c.req.param('slug')}':`, error);
    if (error instanceof Error && error.message.includes('not found')) {
      throw new HTTPException(404, { message: `Post with slug '${c.req.param('slug')}' not found` });
    }
    throw new HTTPException(500, { message: 'Failed to fetch post' });
  }
});

export default posts;