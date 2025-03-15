import { Link, Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              shuymn.me
            </Link>
            <nav className="space-x-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <a 
                href="https://github.com/shuymn" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 hover:text-gray-900"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="py-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} shuymn. All rights reserved.
            </div>
            <div className="mt-4 sm:mt-0">
              <a 
                href="https://github.com/shuymn/shuymn.me" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 hover:text-gray-900"
              >
                Source on GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
