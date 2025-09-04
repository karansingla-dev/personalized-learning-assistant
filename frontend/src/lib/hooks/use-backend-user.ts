// frontend/lib/hooks/use-backend-user.ts
/**
 * Custom hook to manage user data from backend
 * Syncs Clerk auth with backend user data
 */

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { User } from '@/types';
import { getCurrentUser, getCachedUserData } from '@/lib/api/auth';

interface UseBackendUserReturn {
  backendUser: User | null;
  isLoading: boolean;
  error: string | null;
  isOnboarded: boolean;
  refreshUser: () => Promise<void>;
}

export function useBackendUser(): UseBackendUserReturn {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const fetchUserData = async () => {
    if (!clerkUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to get cached data first for faster load
      const cached = getCachedUserData();
      if (cached) {
        setBackendUser(cached);
        setIsOnboarded(cached.onboarding_completed || false);
      }

      // Fetch fresh data from backend
      const response = await getCurrentUser(clerkUser.id);
      
      if (response?.user) {
        setBackendUser(response.user);
        setIsOnboarded(response.onboarding_completed);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data');
      
      // Use cached data if available
      const cached = getCachedUserData();
      if (cached) {
        setBackendUser(cached);
        setIsOnboarded(cached.onboarding_completed || false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data when Clerk user changes
  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      fetchUserData();
    } else if (clerkLoaded && !clerkUser) {
      // User logged out
      setBackendUser(null);
      setIsOnboarded(false);
      setIsLoading(false);
    }
  }, [clerkUser?.id, clerkLoaded]);

  return {
    backendUser,
    isLoading: !clerkLoaded || isLoading,
    error,
    isOnboarded,
    refreshUser: fetchUserData,
  };
}