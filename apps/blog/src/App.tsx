import { RouterProvider } from 'react-router-dom';

import { createRouter } from './routes';
import './style.css';

export default function App() {
  // クライアントサイドでのみルーターを作成
  const router = typeof window !== 'undefined' ? createRouter() : null;
  
  if (!router) {
    return null; // SSRの場合は何も描画しない
  }
  
  return <RouterProvider router={router} />;
}
