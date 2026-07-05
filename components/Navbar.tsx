'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-red-600">
          🍜 မုန့်ဆိုင်
        </Link>
        <div className="flex gap-4">
          <Link
            href="/"
            className={`px-4 py-2 rounded ${
              pathname === '/' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Menu
          </Link>
          <Link
            href="/admin"
            className={`px-4 py-2 rounded ${
              pathname === '/admin' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔧 Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}