// frontend/app/(dashboard)/dashboard/page.tsx
'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to your Dashboard!
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">User Information</h2>
          <p className="text-gray-600">Name: {user?.firstName} {user?.lastName}</p>
          <p className="text-gray-600">Email: {user?.primaryEmailAddress?.emailAddress}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Topics</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-gray-600">Ready to learn</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Quizzes</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-gray-600">Completed</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Study Streak</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-gray-600">Days</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-gray-600">
            This is a placeholder dashboard. The full dashboard will be implemented in Day 2.
          </p>
        </div>
      </div>
    </div>
  );
}