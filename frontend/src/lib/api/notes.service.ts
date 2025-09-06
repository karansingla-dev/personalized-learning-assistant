// ============================================
// frontend/src/lib/api/notes.service.ts
/**
 * Notes API Service
 * Add this missing service
 */

import { apiClient } from './client';

export interface Note {
  id?: string;
  user_id: string;
  topic_id: string;
  syllabus_id?: string;
  title: string;
  content: string;
  tags: string[];
}

class NotesService {
  async createNote(note: Note): Promise<Note> {
    return apiClient.post<Note>('/notes', note);
  }

  async getNotes(userId: string, topicId?: string): Promise<Note[]> {
    const params: any = { user_id: userId };
    if (topicId) params.topic_id = topicId;
    return apiClient.get<Note[]>('/notes', params);
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    return apiClient.put<Note>(`/notes/${noteId}`, updates);
  }

  async deleteNote(noteId: string): Promise<void> {
    return apiClient.delete(`/notes/${noteId}`);
  }
}

export const notesService = new NotesService();