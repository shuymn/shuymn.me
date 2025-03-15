// microCMSのコンテンツ共通型
export type MicroCMSContentId = {
  id: string;
};

export type MicroCMSDate = {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type MicroCMSListResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};

// タグの型定義
export type Tag = {
  name: string;
  slug: string;
} & MicroCMSContentId & MicroCMSDate;

export type TagsResponse = MicroCMSListResponse<Tag>;

// 記事の型定義
export type Post = {
  title: string;
  description: string;
  content: string;
  slug: string;
  tags?: (Pick<Tag, 'id' | 'name' | 'slug'>)[];
} & MicroCMSContentId & MicroCMSDate;

export type PostsResponse = MicroCMSListResponse<Post>;

// メタデータ型
export type MetaData = {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
};
