// frontend/src/lib/api/syllabus.service.ts
/**
 * Syllabus API service
 * Handles syllabus upload and management
 */

import { apiClient } from './client';

export interface Syllabus {
  id: string;
  user_id: string;
  file_name: string;
  file_url?: string;
  content: string;
  topics: Topic[];
  uploaded_at: string;
  processed_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  importance: number;
  syllabus_id: string;
}

class SyllabusService {
  async uploadSyllabus(file: File, userId: string): Promise<Syllabus> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    // Note: Don't set Content-Type header, let browser set it with boundary
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/syllabus/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload syllabus');
    }

    return response.json();
  }

  async getSyllabi(userId: string): Promise<Syllabus[]> {
    return apiClient.get<Syllabus[]>('/syllabus/list', { user_id: userId });
  }

  async getSyllabus(syllabusId: string): Promise<Syllabus> {
    return apiClient.get<Syllabus>(`/syllabus/${syllabusId}`);
  }

  async deleteSyllabus(syllabusId: string): Promise<void> {
    return apiClient.delete(`/syllabus/${syllabusId}`);
  }

  async getTopics(syllabusId: string): Promise<Topic[]> {
    return apiClient.get<Topic[]>(`/syllabus/${syllabusId}/topics`);
  }
}

export const syllabusService = new SyllabusService();