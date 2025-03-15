import { createClient } from 'microcms-js-sdk';
import type { MicroCMSQueries } from 'microcms-js-sdk';

import type { Post, PostResponse, PostsResponse, Tag, TagResponse, TagsResponse } from '../schemas/microcms';

const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN || '',
  apiKey: process.env.MICROCMS_API_KEY || '',
});

/** 記事一覧を取得 */
export const getPosts = async (queries?: MicroCMSQueries): Promise<PostsResponse> => {
  return await client.get<PostsResponse>({ endpoint: 'posts', queries });
};

/** 特定の記事を取得 */
export const getPost = async (contentId: string, queries?: MicroCMSQueries): Promise<PostResponse> => {
  return await client.get<Post>({ endpoint: 'posts', contentId, queries });
};

/** タグ一覧を取得 */
export const getTags = async (queries?: MicroCMSQueries): Promise<TagsResponse> => {
  return await client.get<TagsResponse>({ endpoint: 'tags', queries });
};

/** 特定のタグを取得 */
export const getTag = async (contentId: string, queries?: MicroCMSQueries): Promise<TagResponse> => {
  return await client.get<Tag>({ endpoint: 'tags', contentId, queries });
};

/** スラッグから記事を取得 */
export const getPostBySlug = async (slug: string, queries?: MicroCMSQueries): Promise<PostResponse> => {
  const posts = await client.get<PostsResponse>({
    endpoint: 'posts',
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
      ...queries,
    },
  });
  
  if (posts.contents.length === 0) {
    throw new Error(`Post with slug '${slug}' not found`);
  }
  
  return posts.contents[0];
};

/** タグに紐づく記事一覧を取得 */
export const getPostsByTag = async (tagId: string, queries?: MicroCMSQueries): Promise<PostsResponse> => {
  return await client.get<PostsResponse>({
    endpoint: 'posts',
    queries: {
      filters: `tags[contains]${tagId}`,
      ...queries,
    },
  });
};
