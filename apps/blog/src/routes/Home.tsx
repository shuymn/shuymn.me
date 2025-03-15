import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getPosts } from '../lib/api';
import type { Post } from '../lib/types';
import { formatDate } from '../lib/utils';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setIsLoading(true);
        const response = await getPosts({ limit: 10, orders: '-publishedAt' });
        setPosts(response.contents);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('記事の取得に失敗しました。後でもう一度お試しください。');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Recent Posts</h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          記事がありません。
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <Link to={`/posts/${post.slug}`}>
                <h2 className="text-2xl font-bold mb-2 hover:text-blue-600">{post.title}</h2>
                <div className="text-gray-500 text-sm mb-4">
                  {formatDate(post.publishedAt)}
                </div>
                <p className="text-gray-700 mb-4">{post.description}</p>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag.id} 
                        className="inline-block bg-gray-100 px-3 py-1 text-sm text-gray-700 rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
