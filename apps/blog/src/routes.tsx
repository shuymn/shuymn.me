import { RouteObject } from 'react-router-dom';
import RootLayout from './routes/RootLayout';
import Home from './routes/Home';
import Post from './routes/Post';
import NotFound from './routes/NotFound';

// APIエンドポイントのベースURL
const API_URL = typeof process !== 'undefined' 
  ? process.env.API_URL || 'https://api.shuymn.me' 
  : 'https://api.shuymn.me';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          const response = await fetch(`${API_URL}/api/posts`);
          if (!response.ok) {
            throw new Response('記事一覧の取得に失敗しました', { status: response.status });
          }
          return response.json();
        },
      },
      {
        path: 'posts/:slug',
        element: <Post />,
        loader: async ({ params }) => {
          const response = await fetch(`${API_URL}/api/posts/${params.slug}`);
          if (!response.ok) {
            throw new Response('記事が見つかりませんでした', { status: 404 });
          }
          return response.json();
        },
      },
    ],
  },
];
