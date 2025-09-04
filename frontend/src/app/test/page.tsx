// frontend/app/test/page.tsx
'use client';

import { useAuth, useUser, SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const { isLoaded, userId, sessionId, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  const handleSignUp = () => {
    router.push('/auth/sign-up');
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Clerk Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Auth Status:</h2>
        <p>Auth Loaded: {isLoaded ? '✅ Yes' : '⏳ No'}</p>
        <p>User Loaded: {userLoaded ? '✅ Yes' : '⏳ No'}</p>
        <p>Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</p>
        <p>User ID: {userId || 'None'}</p>
        <p>Session ID: {sessionId || 'None'}</p>
      </div>

      {user && (
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">User Info:</h2>
          <p>Email: {user.primaryEmailAddress?.emailAddress || 'No email'}</p>
          <p>Name: {user.firstName} {user.lastName}</p>
          <p>Username: {user.username || 'No username'}</p>
          <p>Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
        <button 
          onClick={handleHome}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Home
        </button>
        {!isSignedIn ? (
          <>
            <button 
              onClick={handleSignIn}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </button>
            <button 
              onClick={handleSignUp}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Dashboard
            </button>
            <SignOutButton>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Sign Out
              </button>
            </SignOutButton>
          </>
        )}
      </div>

      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Environment Check:</h3>
        <p className="text-sm text-gray-600">
          Publishable Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}
        </p>
        <p className="text-sm text-gray-600">
          API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}
        </p>
      </div>

      <div className="mt-8 bg-yellow-50 p-4 rounded border border-yellow-200">
        <h3 className="font-semibold mb-2 text-yellow-800">Navigation Test:</h3>
        <p className="text-sm text-yellow-700 mb-2">
          Using buttons with router.push() instead of Link components to avoid Next.js 15 issues.
        </p>
        <div className="space-y-1 text-sm">
          <p>✓ Home: {handleHome.toString().includes('router.push') ? 'Ready' : 'Error'}</p>
          <p>✓ Sign In: {handleSignIn.toString().includes('router.push') ? 'Ready' : 'Error'}</p>
          <p>✓ Sign Up: {handleSignUp.toString().includes('router.push') ? 'Ready' : 'Error'}</p>
        </div>
      </div>
    </div>
  );
}