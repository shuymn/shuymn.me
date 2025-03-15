import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  content: string;
}

export default function Post() {
  const post = useLoaderData() as Post;
  
  return (
    <article className="prose prose-lg max-w-none">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-gray-500">
          公開日: {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
          {post.updatedAt !== post.publishedAt && 
            ` (更新日: ${new Date(post.updatedAt).toLocaleDateString('ja-JP')})`}
        </p>
      </header>
      
      <div className="mb-12" dangerouslySetInnerHTML={{ __html: post.content }} />
      
      <div className="mt-12 pt-4 border-t">
        <Link to="/" className="text-blue-600 hover:underline">← ホームに戻る</Link>
      </div>
    </article>
  );
}
