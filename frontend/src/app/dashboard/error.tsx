// frontend/src/app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error while loading your dashboard.
          </p>

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-mono text-gray-700 break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Try Again
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}