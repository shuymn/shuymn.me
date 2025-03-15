import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">ページが見つかりませんでした</h2>
      
      <p className="text-gray-600 max-w-md mx-auto mb-8">
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      
      <Link 
        to="/" 
        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        ホームに戻る
      </Link>
    </div>
  );
}
