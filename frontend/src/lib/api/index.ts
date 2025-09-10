// ============================================
// frontend/src/lib/api/index.ts
/**
 * Update the main export file to include all services
 */

export { apiClient, ApiError } from './client';
export { authService } from './auth.service';
export { quizService } from './quiz.service';
export { studyPlannerService } from './study-planner.service';
export { contentService } from './content.service';
export { progressService } from './progress.service';

// Export all types
export type * from './auth.service';
export type * from './quiz.service';
export type * from './study-planner.service';
export type * from './content.service';
export type * from './progress.service';