// frontend/src/app/dashboard/not-found.tsx
import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/50 to-violet-900/30">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600 opacity-50">404</h1>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-300 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist in your dashboard. 
          It might have been moved or deleted.
        </p>

        {/* Navigation options */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition font-medium transform hover:scale-105"
          >
            Back to Dashboard
          </Link>
          
          <Link
            href="/dashboard/quiz"
            className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition font-medium"
          >
            Take a Quiz
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-300 mb-4">Here are some helpful links:</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 hover:underline transition">
              Dashboard
            </Link>
            <Link href="/dashboard/quiz" className="text-purple-400 hover:text-purple-300 hover:underline transition">
              Quizzes
            </Link>
            <Link href="/dashboard/ai-tutor" className="text-purple-400 hover:text-purple-300 hover:underline transition">
              AI Tutor
            </Link>
            <Link href="/dashboard/progress" className="text-purple-400 hover:text-purple-300 hover:underline transition">
              Progress
            </Link>
            <Link href="/dashboard/study-planner" className="text-purple-400 hover:text-purple-300 hover:underline transition">
              Study Planner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}