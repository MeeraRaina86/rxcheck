// src/app/layout.tsx
'use client'; // This must be a client component to use hooks

import { useEffect, useCallback } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

// We remove the metadata export from here because it's not supported in Client Components.
// You can move this to a wrapping Server Component or manage it with a library if needed.
// export const metadata: Metadata = { ... };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const handleSignOut = useCallback(() => {
    // Don't log out if the user is already on a public page like login or home.
    if (pathname === '/login' || pathname === '/') return;
    
    signOut(auth).then(() => {
      // Inform the user why they were logged out.
      alert("You have been logged out due to 15 minutes of inactivity for your security.");
      window.location.href = '/login';
    });
  }, [pathname]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      // Set timeout to 15 minutes (900000 milliseconds)
      timeoutId = setTimeout(handleSignOut, 900000); 
    };

    // We only want to run this timer logic if the user is on a protected page.
    if (pathname !== '/login' && pathname !== '/') {
      // Events that count as user activity
      const activityEvents: (keyof WindowEventMap)[] = [
        'mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart',
      ];

      // Add event listeners to reset the timer on any user activity
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimeout);
      });

      // Start the timer when the component mounts
      resetTimeout();

      // Clean up by removing the event listeners when the component unmounts
      return () => {
        clearTimeout(timeoutId);
        activityEvents.forEach((event) => {
          window.removeEventListener(event, resetTimeout);
        });
      };
    }
  }, [pathname, handleSignOut]);

  return (
    <html lang="en">
      <head>
        {/* We add the title here since metadata export is removed */}
        <title>RxCheck - Smart Prescription Reviewer</title>
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}