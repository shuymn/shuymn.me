import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import App from './App';

const router = createBrowserRouter(routes);

hydrateRoot(
  document.getElementById('root')!,
  <React.StrictMode>
    <App router={router} />
  </React.StrictMode>
);
