// frontend/src/lib/api/quiz.service.ts
/**
 * Updated Quiz API service
 * Handles quiz generation and management for multiple topics
 */

import { apiClient } from './client';

export interface QuizGenerateRequest {
  user_id: string;
  subject_id: string;
  subject_name: string;
  topic_ids: string[];
  topic_names: string[];
}

export interface QuizQuestion {
  question_id: string;
  question_number: number;
  question_text: string;
  options: string[];
  topic_id?: string;
  topic_name?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface Quiz {
  quiz_id: string;
  total_questions: number;
  time_limit_minutes: number;
  passing_score: number;
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  quiz_id: string;
  user_id: string;
  answers: { [question_id: string]: number }; // question_id -> selected option index
  time_taken_minutes: number;
}

export interface QuizResult {
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  passed_topics: string[];
  time_taken_minutes: number;
  question_results: QuestionResult[];
  message: string;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  options: string[];
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

export interface QuizHistory {
  quiz_id: string;
  subject_name: string;
  topic_names: string[];
  score: number;
  passed: boolean;
  submitted_at: string;
}

class QuizService {
  /**
   * Generate a quiz for selected topics
   */
  async generateQuiz(data: QuizGenerateRequest): Promise<Quiz> {
    return apiClient.post<Quiz>('/quiz/generate', data);
  }

  /**
   * Submit quiz answers and get results
   */
  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return apiClient.post<QuizResult>('/quiz/submit', submission);
  }

  /**
   * Get user's quiz history
   */
  async getQuizHistory(userId: string): Promise<QuizHistory[]> {
    return apiClient.get<QuizHistory[]>(`/quiz/history?user_id=${userId}`);
  }

  /**
   * Get subjects for quiz selection
   */
  async getSubjects(userId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/dashboard/subjects?user_id=${userId}`);
  }

  /**
   * Get topics for a subject
   */
  async getTopics(subjectId: string, userId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/subjects/${subjectId}/topics?user_id=${userId}`);
  }
}

export const quizService = new QuizService();