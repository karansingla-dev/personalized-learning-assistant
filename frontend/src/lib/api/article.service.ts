// frontend/src/lib/api/article.service.ts
/**
 * Article API service
 * Handles all article-related API calls
 */

import { apiClient } from './client';

export interface Article {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  source: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  relevance_score: number;
  order: number;
}

export interface ArticleContent {
  article_id: string;
  url: string;
  title: string;
  content_blocks: ContentBlock[];
  reading_time: number;
  success: boolean;
  from_cache?: boolean;
}

export interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote';
  text?: string;
  level?: number;
  ordered?: boolean;
  items?: string[];
}

export interface ArticlesResponse {
  topic_id: string;
  topic_name: string;
  articles: Article[];
  total_count: number;
  from_cache?: boolean;
}

export interface ArticleStats {
  topic_id: string;
  total_articles: number;
  sources: Record<string, number>;
  difficulties: {
    Easy: number;
    Medium: number;
    Advanced: number;
  };
  cached: boolean;
  cache_age_days?: number;
}

class ArticleService {
  /**
   * Get articles for a specific topic
   */
  async getTopicArticles(
    topicId: string,
    forceRefresh: boolean = false
  ): Promise<ArticlesResponse> {
    return apiClient.get<ArticlesResponse>(
      `/articles/topic/${topicId}`,
      forceRefresh ? { force_refresh: 'true' } : undefined
    );
  }

  /**
   * Fetch and extract article content for in-app reading
   */
  async getArticleContent(articleUrl: string): Promise<ArticleContent> {
    return apiClient.post<ArticleContent>('/articles/content', {
      article_url: articleUrl
    });
  }

  /**
   * Get article statistics for a topic
   */
  async getArticleStats(topicId: string): Promise<ArticleStats> {
    return apiClient.get<ArticleStats>(`/articles/stats/${topicId}`);
  }

  /**
   * Clear cached articles for a topic
   */
  async clearArticleCache(topicId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/articles/cache/${topicId}`);
  }

  /**
   * Search for articles with specific query
   */
  async searchArticles(
    query: string,
    classLevel?: number,
    subject?: string
  ): Promise<Article[]> {
    const params: Record<string, string> = { q: query };
    if (classLevel) params.class_level = classLevel.toString();
    if (subject) params.subject = subject;
    
    return apiClient.get<Article[]>('/articles/search', params);
  }

  /**
   * Mark article as read (for progress tracking)
   */
  async markArticleRead(
    articleId: string,
    topicId: string,
    userId: string
  ): Promise<void> {
    return apiClient.post('/articles/read', {
      article_id: articleId,
      topic_id: topicId,
      user_id: userId
    });
  }

  /**
   * Get reading history
   */
  async getReadingHistory(userId: string): Promise<Article[]> {
    return apiClient.get<Article[]>('/articles/history', { user_id: userId });
  }

  /**
   * Save article for later
   */
  async saveArticle(
    articleId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    return apiClient.post('/articles/save', {
      article_id: articleId,
      user_id: userId
    });
  }

  /**
   * Get saved articles
   */
  async getSavedArticles(userId: string): Promise<Article[]> {
    return apiClient.get<Article[]>('/articles/saved', { user_id: userId });
  }
}

export const articleService = new ArticleService();

// ============================================
// USAGE EXAMPLE IN COMPONENT:
// ============================================
/*
import { articleService } from '@/lib/api/article.service';

// In your component:
const fetchArticles = async () => {
  try {
    const data = await articleService.getTopicArticles(topicId, false);
    setArticles(data.articles);
  } catch (error) {
    console.error('Failed to fetch articles:', error);
  }
};

const fetchArticleContent = async (url: string) => {
  try {
    const content = await articleService.getArticleContent(url);
    setContent(content);
  } catch (error) {
    console.error('Failed to fetch article content:', error);
  }
};
*/