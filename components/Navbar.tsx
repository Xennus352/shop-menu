'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors } from '@/constant/themes';
import { ChefHat } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="p-4"
      style={{ background: colors.surface, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: colors.textDark }}
        >
          <ChefHat className="w-5 h-5" style={{ color: colors.olive }} />
          မုန့်ဆိုင်
        </Link>
        <div className="flex gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: pathname === '/' ? colors.olive : 'transparent',
              color: pathname === '/' ? 'white' : colors.textDark,
              boxShadow: pathname === '/' ? `0 2px 8px ${colors.olive}40` : 'none',
            }}
          >
            Menu
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: pathname.startsWith('/admin') ? colors.olive : 'transparent',
              color: pathname.startsWith('/admin') ? 'white' : colors.textDark,
              boxShadow: pathname.startsWith('/admin') ? `0 2px 8px ${colors.olive}40` : 'none',
            }}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
