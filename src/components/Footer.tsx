// src/components/Footer.tsx
'use client';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Don't show footer on login or home page
  if (pathname === '/login' || pathname === '/') {
    return null;
  }

  return (
    <footer className="w-full mt-12 p-4 bg-gray-100 border-t">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        {/* Warning Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-500 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-gray-600">
          <strong>Disclaimer:</strong> RxCheck is an informational tool and not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>
      </div>
    </footer>
  );
}