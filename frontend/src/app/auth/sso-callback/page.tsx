// frontend/src/app/auth/sso-callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const syncWithBackend = async () => {
      // Wait for Clerk to load
      if (!isLoaded) {
        console.log('Waiting for Clerk to load...');
        return;
      }

      // Check if we have a user
      if (!user) {
        console.log('No user found, redirecting to sign-in...');
        router.push('/auth/sign-in');
        return;
      }

      console.log('User found:', {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
      });

      setDebugInfo({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      });

      try {
        // Prepare user data for backend
        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          username: user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${Date.now()}`,
        };

        console.log('Sending to backend:', userData);

        // Try to register the user
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const responseData = await response.json();
        console.log('Backend response:', responseData);

        if (response.ok) {
          console.log('Registration successful');
          // Check if onboarding is needed
          const isNewUser = new Date(user.createdAt).getTime() > Date.now() - 60000; // Created in last minute
          router.push(isNewUser ? '/onboarding' : '/dashboard');
        } else if (response.status === 409) {
          // User already exists, try login
          console.log('User exists, attempting login...');
          const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clerk_id: user.id }),
          });

          const loginData = await loginResponse.json();
          console.log('Login response:', loginData);

          if (loginResponse.ok) {
            router.push(loginData.redirect_to || '/dashboard');
          } else {
            throw new Error('Login failed');
          }
        } else {
          throw new Error(responseData.detail || 'Registration failed');
        }
      } catch (error) {
        console.error('Backend sync error:', error);
        setError(`Failed to sync with backend: ${error}`);
        
        // Still redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    };

    syncWithBackend();
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Completing sign in...</p>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-left bg-gray-100 rounded p-4">
              <p className="text-xs font-mono text-gray-600">Debug Info:</p>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-2">Redirecting anyway...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
