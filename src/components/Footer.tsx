// src/components/Footer.tsx
'use client';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Don't show footer on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className="w-full mt-12 p-4 bg-gray-100 border-t">
      <p className="text-center text-xs text-gray-500">
        <strong>Disclaimer:</strong> RxCheck is an informational tool and not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
      </p>
    </footer>
  );
}