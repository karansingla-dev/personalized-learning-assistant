/**
 * Main API export file
 * Re-exports all services for easy importing
 */

export { apiClient, ApiError } from './client';
export { authService } from './auth.service';
export { syllabusService } from './syllabus.service';
export { quizService } from './quiz.service';

// Export types
export type { User, RegisterData, LoginData, OnboardingData } from './auth.service';
export type { Syllabus, Topic } from './syllabus.service';
export type { Quiz, Question, QuizSubmission } from './quiz.service';