// frontend/lib/api/client.ts
/**
 * API client configuration using Axios
 * Handles all API requests to the backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// API base URL from environment or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get Clerk token
async function getClerkToken(): Promise<string | null> {
  if (typeof window !== 'undefined' && window.Clerk) {
    try {
      const token = await window.Clerk.session?.getToken();
      return token || null;
    } catch (error) {
      console.error('Error getting Clerk token:', error);
      return null;
    }
  }
  return null;
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from Clerk
    const token = await getClerkToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/sign-in';
          }
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 422:
          // Validation error
          const errors = (error.response.data as any)?.detail;
          if (Array.isArray(errors)) {
            errors.forEach((err: any) => {
              toast.error(err.msg || err.message || 'Validation error');
            });
          } else if (errors) {
            toast.error(errors);
          } else {
            toast.error(message);
          }
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message || 'An error occurred');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Generic request handler
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>({ ...config, method: 'GET', url }),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

// File upload handler
export async function uploadFile(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Get token for file upload
  const token = await getClerkToken();
  
  return apiRequest({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });
}

// Custom hook for API calls with Clerk token (optional)
export function useApiClient() {
  return {
    api,
    uploadFile,
  };
}