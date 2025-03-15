import type { MicroCMSContentId, MicroCMSDate, MicroCMSListResponse } from 'microcms-js-sdk';

/** タグスキーマ */
export type Tag = {
  name: string;
  slug: string;
};

export type TagResponse = Tag & MicroCMSContentId & MicroCMSDate;
export type TagsResponse = MicroCMSListResponse<TagResponse>;

/** 記事スキーマ */
export type Post = {
  title: string;
  description: string;
  content: string;
  slug: string;
  tags?: (Tag & MicroCMSContentId)[];
};

export type PostResponse = Post & MicroCMSContentId & MicroCMSDate;
export type PostsResponse = MicroCMSListResponse<PostResponse>;
