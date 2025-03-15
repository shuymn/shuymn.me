import type { Post, PostsResponse, Tag, TagsResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.shuymn.me';

/**
 * 記事一覧を取得
 */
export async function getPosts(params?: Record<string, string | number>): Promise<PostsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/v1/posts${query}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }
  
  return response.json();
}

/**
 * 記事詳細を取得
 */
export async function getPost(slug: string): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/v1/posts/${slug}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${response.status}`);
  }
  
  return response.json();
}

/**
 * タグ一覧を取得
 */
export async function getTags(): Promise<TagsResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/tags`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.status}`);
  }
  
  return response.json();
}

/**
 * タグの詳細を取得
 */
export async function getTag(id: string): Promise<Tag> {
  const response = await fetch(`${API_BASE_URL}/v1/tags/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tag: ${response.status}`);
  }
  
  return response.json();
}

/**
 * タグに紐づく記事一覧を取得
 */
export async function getPostsByTag(tagId: string, params?: Record<string, string | number>): Promise<PostsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/v1/posts/tag/${tagId}${query}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch posts by tag: ${response.status}`);
  }
  
  return response.json();
}
