import { z } from 'zod';

/** 記事一覧取得リクエスト検証 */
export const getPostsSchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  filters: z.string().optional(),
  fields: z.string().optional(),
  orders: z.string().optional(),
  ids: z.string().optional(),
  q: z.string().optional(),
});

/** 記事詳細取得リクエスト検証 */
export const getPostSchema = z.object({
  slug: z.string(),
  fields: z.string().optional(),
});

/** タグ一覧取得リクエスト検証 */
export const getTagsSchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  fields: z.string().optional(),
});

/** タグに紐づく記事一覧取得リクエスト検証 */
export const getPostsByTagSchema = z.object({
  tagId: z.string(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  fields: z.string().optional(),
  orders: z.string().optional(),
});
