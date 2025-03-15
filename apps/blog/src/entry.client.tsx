import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

// DOMコンテンツが読み込まれてから実行
document.addEventListener('DOMContentLoaded', () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
