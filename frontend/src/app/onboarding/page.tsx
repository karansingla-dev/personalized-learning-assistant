// frontend/app/onboarding/page.tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function OnboardingPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (authLoaded && !userId) {
      router.push('/auth/sign-in');
    }
  }, [authLoaded, userId, router]);

  const handleComplete = async () => {
    setIsLoading(true);
    // Set a cookie to mark onboarding as complete
    document.cookie = 'onboarded=true; path=/; max-age=31536000'; // 1 year
    router.push('/dashboard');
  };

  const handleSkip = () => {
    // For now, just go to dashboard
    router.push('/dashboard');
  };

  // Show loading while Clerk loads
  if (!userLoaded || !authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show error
  if (!user || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <p className="text-gray-700 mb-4">Unable to load user information.</p>
          <button
            onClick={() => router.push('/auth/sign-in')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Main onboarding content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {user.firstName || user.emailAddresses?.[0]?.emailAddress || 'Student'}! 👋
            </h1>
            
            <p className="text-gray-600">
              Let's set up your personalized learning profile
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                Complete Your Profile
              </h2>
              <p className="text-gray-600 ml-11">
                We'll need some additional information to personalize your learning experience.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                Set Learning Goals
              </h2>
              <p className="text-gray-600 ml-11">
                Tell us about your educational background and what you want to achieve.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                Upload Your Syllabus
              </h2>
              <p className="text-gray-600 ml-11">
                Upload your course syllabus and we'll create a personalized study plan.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Full onboarding flow with detailed forms will be implemented in Day 2. For now, you can skip to the dashboard.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting up...' : 'Complete Setup (Coming Soon)'}
            </button>
            
            <button
              onClick={handleSkip}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Skip for Now → Go to Dashboard
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You can complete your profile anytime from the dashboard settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}