import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getPost } from '../lib/api';
import type { Post } from '../lib/types';
import { formatDate } from '../lib/utils';

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;

      try {
        setIsLoading(true);
        const postData = await getPost(slug);
        setPost(postData);
      } catch (err) {
        console.error(`Failed to fetch post with slug "${slug}":`, err);
        setError('記事の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  // カスタムメタデータをセット
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | shuymn.me`;
      
      // meta descriptionを更新
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.description);
      }
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
        <h1 className="text-xl font-bold mb-2">エラーが発生しました</h1>
        <p>{error}</p>
        <Link to="/" className="text-red-600 hover:underline mt-4 inline-block">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-bold mb-4">記事が見つかりませんでした</h1>
        <p className="text-gray-600 mb-8">
          お探しの記事は削除されたか、URLが間違っている可能性があります。
        </p>
        <Link to="/" className="text-blue-600 hover:underline">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/" className="text-blue-600 hover:underline mb-6 inline-block">
        ← ホームに戻る
      </Link>
      
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="text-gray-500 text-sm mb-8">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        {post.updatedAt !== post.publishedAt && (
          <span> (更新日: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>)</span>
        )}
      </div>
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tags/${tag.id}`}
              className="inline-block bg-gray-100 hover:bg-gray-200 px-3 py-1 text-sm text-gray-700 rounded-full"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
      
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
