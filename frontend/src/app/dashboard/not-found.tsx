// frontend/src/app/dashboard/not-found.tsx
import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600 opacity-50">404</h1>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist in your dashboard. 
          It might have been moved or deleted.
        </p>

        {/* Navigation options */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Back to Dashboard
          </Link>
          
          <Link
            href="/dashboard/syllabus"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Upload Syllabus
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Here are some helpful links:</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard/topics" className="text-purple-600 hover:underline">
              Topics
            </Link>
            <Link href="/dashboard/quiz" className="text-purple-600 hover:underline">
              Quizzes
            </Link>
            <Link href="/dashboard/notes" className="text-purple-600 hover:underline">
              Notes
            </Link>
            <Link href="/dashboard/progress" className="text-purple-600 hover:underline">
              Progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}