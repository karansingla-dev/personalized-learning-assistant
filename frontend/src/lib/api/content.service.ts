// ============================================
// frontend/src/lib/api/content.service.ts
/**
 * Content Discovery API Service
 * Add this for better content management
 */

import { apiClient } from './client';

export interface ContentRequest {
  topic_id: string;
  topic_name: string;
  subject: string;
  class_level: number;
}

export interface LearningContent {
  explanation: any;
  web_resources: any[];
  practice_questions: any[];
  videos?: any[];
  articles?: any[];
}

export interface Article {
  id: string;
  title: string;
  source: string;
  type: string;
  icon: string;
  url: string;
  reading_time: string;
  difficulty: string;
  highlights: string[];
  // Add these new fields
  content?: string;
  ai_summary?: string;
  quality_score?: number;
  images?: Array<{
    url: string;
    alt: string;
    caption: string;
  }>;
}

class ContentService {
  async generateContent(data: ContentRequest): Promise<LearningContent> {
    return apiClient.post<LearningContent>('/curriculum/generate-content', data);
  }

  async getTopicContent(topicId: string, forceRefresh = false): Promise<any> {
    const params: any = {};
    if (forceRefresh) params.refresh = 'true';
    return apiClient.get(`/topics/${topicId}/content`, params);
  }

  async summarizeVideo(videoUrl: string): Promise<any> {
    return apiClient.post('/curriculum/summarize-video', { video_url: videoUrl });
  }

  async markContentWatched(userId: string, topicId: string, contentId: string): Promise<void> {
    return apiClient.post('/content/mark-watched', {
      user_id: userId,
      topic_id: topicId,
      content_id: contentId
    });
  }
}

export const contentService = new ContentService();