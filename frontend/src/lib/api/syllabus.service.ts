// frontend/src/lib/api/syllabus.service.ts
/**
 * Fixed Syllabus API service
 */

// Use direct fetch instead of the apiClient to avoid any issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

console.log('API Base URL:', API_BASE_URL); // Debug log

export interface Syllabus {
  id: string;
  user_id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
  topics?: any[];
  topics_count?: number;
}

export interface Topic {
  id?: string;
  name: string;
  description: string;
  importance: number;
  prerequisites?: string[];
  estimated_hours?: number;
  syllabus_id: string;
}

class SyllabusService {
  private getApiUrl(): string {
    // Always use the hardcoded URL for now to ensure it works
    return 'http://localhost:8000/api/v1';
  }

  async uploadSyllabus(file: File, userId: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);

      const url = `${this.getApiUrl()}/syllabus/upload`;
      console.log('Upload URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async getSyllabi(userId: string): Promise<Syllabus[]> {
    try {
      const url = `${this.getApiUrl()}/syllabus/list?user_id=${userId}`;
      console.log('Fetching syllabi from:', url); // Debug log

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        // Return empty array instead of throwing to prevent page crash
        return [];
      }

      const data = await response.json();
      console.log('Syllabi data:', data); // Debug log
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      // Return empty array to prevent page crash
      return [];
    }
  }

  async getSyllabus(syllabusId: string): Promise<Syllabus | null> {
    try {
      const url = `${this.getApiUrl()}/syllabus/${syllabusId}`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      return null;
    }
  }

  async deleteSyllabus(syllabusId: string): Promise<void> {
    try {
      const url = `${this.getApiUrl()}/syllabus/${syllabusId}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete syllabus');
      }
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      throw error;
    }
  }

  async getTopics(syllabusId: string): Promise<Topic[]> {
    try {
      const url = `${this.getApiUrl()}/syllabus/${syllabusId}/topics`;
      const response = await fetch(url);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  }
}

export const syllabusService = new SyllabusService();