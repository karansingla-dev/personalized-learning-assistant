// ============================================
// frontend/src/lib/api/progress.service.ts
/**
 * Progress Tracking API Service
 * Improve the existing progress tracking
 */

import { apiClient } from './client';

export interface UserProgress {
  total_topics: number;
  completed_topics: number;
  in_progress_topics: number;
  total_study_hours: number;
  average_quiz_score: number;
  current_streak: number;
  weekly_progress: any;
}

export interface TopicProgress {
  user_id: string;
  topic_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  time_spent_minutes: number;
  last_accessed: string;
  quiz_scores: number[];
}

class ProgressService {
  async getUserProgress(userId: string): Promise<UserProgress> {
    return apiClient.get<UserProgress>(`/users/${userId}/progress`);
  }

  async getTopicProgress(userId: string, topicId: string): Promise<TopicProgress> {
    return apiClient.get<TopicProgress>(`/progress/${userId}/${topicId}`);
  }

  async updateTopicProgress(userId: string, topicId: string, progress: Partial<TopicProgress>): Promise<void> {
    return apiClient.post(`/progress/update`, {
      user_id: userId,
      topic_id: topicId,
      ...progress
    });
  }

  async startTopic(userId: string, topicId: string): Promise<void> {
    return apiClient.post(`/progress/topic/${topicId}/start`, {
      user_id: userId
    });
  }

  async completeTopic(userId: string, topicId: string): Promise<void> {
    return apiClient.post(`/progress/topic/${topicId}/complete`, {
      user_id: userId
    });
  }
}

export const progressService = new ProgressService();