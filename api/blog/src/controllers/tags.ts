import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { HTTPException } from 'hono/http-exception';

import { getTag, getTags } from '../client/microcms';
import { cacheControl } from '../middlewares/cache-control';
import { getTagsSchema } from '../schemas/validators';

const tags = new Hono();

// タグ一覧を取得
tags.get('/', zValidator('query', getTagsSchema), cacheControl({ maxAge: 3600 }), cache({
  cacheName: 'BLOG_CACHE',
  cacheControl: 'max-age=3600, s-maxage=7200',
}), async (c) => {
  try {
    const queries = c.req.valid('query');
    const response = await getTags(queries);
    return c.json(response);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new HTTPException(500, { message: 'Failed to fetch tags' });
  }
});

// 特定のタグを取得
tags.get('/:id', cacheControl({ maxAge: 3600 }), cache({
  cacheName: 'BLOG_CACHE',
  cacheControl: 'max-age=3600, s-maxage=7200',
}), async (c) => {
  try {
    const id = c.req.param('id');
    const queries = c.req.query();
    const tag = await getTag(id, { fields: queries.fields });
    return c.json(tag);
  } catch (error) {
    console.error(`Error fetching tag with id '${c.req.param('id')}':`, error);
    throw new HTTPException(500, { message: 'Failed to fetch tag' });
  }
});

export default tags;
