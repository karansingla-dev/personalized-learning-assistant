// frontend/src/lib/api/quiz.service.ts
/**
 * Quiz API service
 * Handles quiz generation and management
 */

import { apiClient } from './client';

export interface Quiz {
  id: string;
  topic_id: string;
  user_id: string;
  questions: Question[];
  score?: number;
  completed_at?: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: { question_id: string; answer: number }[];
}

class QuizService {
  async generateQuiz(topicId: string, userId: string): Promise<Quiz> {
    return apiClient.post<Quiz>('/quiz/generate', { topic_id: topicId, user_id: userId });
  }

  async getQuiz(quizId: string): Promise<Quiz> {
    return apiClient.get<Quiz>(`/quiz/${quizId}`);
  }

  async submitQuiz(submission: QuizSubmission): Promise<{ score: number; correct: number; total: number }> {
    return apiClient.post('/quiz/submit', submission);
  }

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    return apiClient.get<Quiz[]>('/quiz/user', { user_id: userId });
  }
}

export const quizService = new QuizService();