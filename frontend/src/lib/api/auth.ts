// frontend/lib/api/auth.ts
/**
 * Authentication API functions
 * Handles user registration and login with backend
 */

import { api } from './client';
import { User } from '@/types';

export interface RegisterUserData {
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginUserData {
  clerk_id: string;
}

export interface AuthResponse {
  user: User;
  onboarding_completed: boolean;
  redirect_to?: string;
}

/**
 * Register a new user in the backend after Clerk signup
 */
export async function registerUser(data: RegisterUserData): Promise<User> {
  try {
    const response = await api.post<User>('/auth/register', data);
    
    // Store user data in localStorage for quick access
    if (response) {
      localStorage.setItem('user_data', JSON.stringify(response));
    }
    
    return response;
  } catch (error) {
    console.error('Failed to register user:', error);
    throw error;
  }
}

/**
 * Sync user login with backend
 */
export async function loginUser(data: LoginUserData): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    // Store user data in localStorage
    if (response?.user) {
      localStorage.setItem('user_data', JSON.stringify(response.user));
      localStorage.setItem('onboarding_completed', String(response.onboarding_completed));
    }
    
    return response;
  } catch (error) {
    console.error('Failed to sync login:', error);
    throw error;
  }
}

/**
 * Get current user data from backend
 */
export async function getCurrentUser(clerkId: string): Promise<AuthResponse> {
  try {
    const response = await api.get<AuthResponse>(`/auth/me?clerk_id=${clerkId}`);
    
    // Update localStorage
    if (response?.user) {
      localStorage.setItem('user_data', JSON.stringify(response.user));
      localStorage.setItem('onboarding_completed', String(response.onboarding_completed));
    }
    
    return response;
  } catch (error) {
    console.error('Failed to get user data:', error);
    throw error;
  }
}

/**
 * Clear local user data (on logout)
 */
export function clearUserData(): void {
  localStorage.removeItem('user_data');
  localStorage.removeItem('onboarding_completed');
  // Don't clear the onboarded cookie here - let Clerk handle it
}

/**
 * Get cached user data from localStorage
 */
export function getCachedUserData(): User | null {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

/**
 * Check if onboarding is completed
 */
export function isOnboardingCompleted(): boolean {
  return localStorage.getItem('onboarding_completed') === 'true';
}