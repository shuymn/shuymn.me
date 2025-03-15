import { createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import Home from './routes/Home';
import Post from './routes/Post';
import NotFound from './routes/NotFound';

export const routes = [
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

export const router = createBrowserRouter(routes);
