import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <header className="py-6 mb-8 border-b">
        <nav className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">shuymn.me</Link>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">ホーム</Link></li>
            <li><a href="https://github.com/shuymn" className="hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </nav>
      </header>
      
      <main className="min-h-screen pb-12">
        <Outlet />
      </main>
      
      <footer className="py-6 mt-12 border-t text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} shuymn. All rights reserved.</p>
      </footer>
    </div>
  );
}
