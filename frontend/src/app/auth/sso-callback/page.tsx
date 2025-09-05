// frontend/src/app/auth/sso-callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useSignUp, useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a sign-up flow
        if (signUp?.status === 'complete') {
          await setActiveSignUp({ session: signUp.createdSessionId });
          
          // Sync with backend
          await syncNewUserWithBackend(signUp.createdUserId!);
          
          router.push('/onboarding');
          return;
        }

        // Check if this is a sign-in flow
        if (signIn?.status === 'complete') {
          await setActiveSignIn({ session: signIn.createdSessionId });
          
          // Check onboarding status
          const onboardingComplete = await checkOnboardingStatus(signIn.createdSessionId!);
          
          router.push(onboardingComplete ? '/dashboard' : '/onboarding');
          return;
        }

        // If neither is complete, redirect to sign-in
        router.push('/auth/sign-in');
      } catch (error) {
        console.error('SSO callback error:', error);
        router.push('/auth/sign-in');
      }
    };

    handleCallback();
  }, [signUp, signIn, setActiveSignUp, setActiveSignIn, router]);

  const syncNewUserWithBackend = async (clerkId: string) => {
    try {
      // Get user data from Clerk
      const response = await fetch('http://localhost:8000/api/v1/auth/register-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerk_id: clerkId }),
      });
      
      if (!response.ok) {
        console.error('Backend sync failed:', await response.text());
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  };

  const checkOnboardingStatus = async (sessionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/auth/status?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        return data.onboarding_completed || false;
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-700">Completing sign in...</p>
      </div>
    </div>
  );
}