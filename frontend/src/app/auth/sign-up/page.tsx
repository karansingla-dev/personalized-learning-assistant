// frontend/app/auth/sign-up/page.tsx
'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    console.log('Starting sign up process...');

    try {
      // Create the user
      console.log('Creating user with:', { firstName, lastName, email });
      
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      console.log('Sign up result:', result);

      // Check if we need to prepare email verification
      if (result.status === 'complete') {
        // Sign up is complete, set the session
        console.log('Sign up complete, setting session...');
        await setActive({ session: result.createdSessionId });
        router.push('/onboarding');
      } else if (result.status === 'missing_requirements' || result.unverifiedFields?.includes('email_address')) {
        // Send email verification code
        console.log('Preparing email verification...');
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      } else {
        // Handle other statuses
        console.log('Unexpected status:', result.status);
        setError('Sign up process incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign up error details:', {
        message: err.message,
        errors: err.errors,
        fullError: err
      });
      
      // Try to extract meaningful error message
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorMessage = err.errors[0]?.longMessage || err.errors[0]?.message || 'Sign up failed';
        setError(errorMessage);
      } else if (err.message && !err.message.includes('CAPTCHA')) {
        setError(err.message);
      } else {
        // If it's just CAPTCHA warning, try to continue anyway
        console.log('Attempting to continue despite CAPTCHA warning...');
        try {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPendingVerification(true);
        } catch (innerErr: any) {
          console.error('Failed to send verification:', innerErr);
          setError('Unable to send verification email. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      // Set the session
      await setActive({ session: completeSignUp.createdSessionId });
      
      // Register user in backend
      try {
        await registerUser({
          clerk_id: completeSignUp.createdUserId || '',
          email: email,
          first_name: firstName,
          last_name: lastName,
        });
        toast.success('Account created successfully!');
      } catch (backendError) {
        console.error('Backend registration error:', backendError);
        // Continue anyway - user can still use the app
        toast.warning('Account created but profile sync failed. You can update your profile later.');
      }
      
      router.push('/onboarding');
      
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInClick = () => {
    router.push('/auth/sign-in');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          {!pendingVerification ? (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Create Your Account
                </h1>
                <p className="text-gray-600">
                  Start your personalized learning journey today
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                    placeholder="At least 8 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-700">
                  Already have an account?{' '}
                  <button 
                    onClick={handleSignInClick}
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Verify Your Email
                </h1>
                <p className="text-gray-600">
                  We've sent a verification code to
                </p>
                <p className="text-gray-800 font-semibold">{email}</p>
              </div>

              <form onSubmit={handleVerification} className="space-y-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-center text-2xl font-mono tracking-widest bg-white text-gray-900 placeholder-gray-400"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button
                  onClick={() => setPendingVerification(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  ← Back to sign up
                </button>
                
                <div className="text-sm">
                  <p className="text-gray-500 mb-2">Having trouble?</p>
                  <button
                    onClick={() => router.push('/auth/sign-in')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Try signing in instead
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-gray-700 hover:text-gray-900 font-medium underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}