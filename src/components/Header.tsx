// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };
  
  if (pathname === '/login' || pathname === '/') {
    return null;
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
          {/* Logo */}
          <div className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full text-white">
            R<span className="text-xl">✓</span>
          </div>
          RxCheck
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className={`text-gray-600 hover:text-indigo-600 ${pathname === '/dashboard' ? 'font-bold' : ''}`}>
            Dashboard
          </Link>
          <Link href="/profile" className={`text-gray-600 hover:text-indigo-600 ${pathname === '/profile' ? 'font-bold' : ''}`}>
            Profile
          </Link>
          <Link href="/analyze" className={`text-gray-600 hover:text-indigo-600 ${pathname === '/analyze' ? 'font-bold' : ''}`}>
            Analyze
          </Link>
          {user && (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}