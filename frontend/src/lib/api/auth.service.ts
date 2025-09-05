// frontend/src/lib/api/auth.service.ts
/**
 * Authentication API service
 * Handles all auth-related API calls
 */

import { apiClient } from './client';

export interface RegisterData {
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  clerk_id: string;
}

export interface OnboardingData {
  clerk_id: string;
  age?: number;
  date_of_birth?: string;
  phone_number?: string;
  class_level?: string;
  school?: string;
  competitive_exam?: string;
  country?: string;
  state?: string;
  city?: string;
}

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

class AuthService {
  async register(data: RegisterData): Promise<User> {
    return apiClient.post<User>('/auth/register', data);
  }

  async login(data: LoginData): Promise<{ user: User; redirect_to: string }> {
    return apiClient.post('/auth/login', data);
  }

  async completeOnboarding(data: OnboardingData): Promise<User> {
    return apiClient.post<User>('/auth/complete-onboarding', data);
  }

  async getCurrentUser(clerkId: string): Promise<User> {
    return apiClient.get<User>('/auth/me', { clerk_id: clerkId });
  }

  async updateProfile(clerkId: string, data: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/users/${clerkId}`, data);
  }
}

export const authService = new AuthService();
