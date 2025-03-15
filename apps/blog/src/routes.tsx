import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import Home from './routes/Home';
import Post from './routes/Post';
import NotFound from './routes/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'posts/:slug',
        element: <Post />,
      },
    ],
  },
];

// クライアントサイドでのみ使用される
export const createRouter = () => {
  return createBrowserRouter(routes);
};
