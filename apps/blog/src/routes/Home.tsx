import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  excerpt: string;
}

export default function Home() {
  const posts = useLoaderData() as Post[];
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">最新の記事</h1>
      
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.id} className="border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">
              <Link to={`/posts/${post.slug}`} className="hover:text-blue-600">
                {post.title}
              </Link>
            </h2>
            
            <p className="text-gray-500 text-sm mb-4">
              {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
              {post.updatedAt !== post.publishedAt && 
                ` (更新日: ${new Date(post.updatedAt).toLocaleDateString('ja-JP')})`}
            </p>
            
            <p className="text-gray-700">{post.excerpt}</p>
            
            <div className="mt-4">
              <Link 
                to={`/posts/${post.slug}`} 
                className="text-blue-600 hover:underline"
              >
                続きを読む →
              </Link>
            </div>
          </article>
        ))}
        
        {posts.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            まだ記事がありません。
          </p>
        )}
      </div>
    </div>
  );
}
