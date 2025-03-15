import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

export default function NotFound() {
  const error = useRouteError() as any;
  const status = error?.status || 404;
  const message = error?.statusText || error?.message || 'ページが見つかりませんでした';
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold mb-4">エラー {status}</h1>
      <p className="text-xl text-gray-600 mb-8">{message}</p>
      <Link to="/" className="text-blue-600 hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
