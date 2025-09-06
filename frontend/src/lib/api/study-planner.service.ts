
// frontend/src/lib/api/study-planner.service.ts
/**
 * Study Planner API Service
 * Add this missing service
 */

import { apiClient } from './client';

export interface StudyPlanRequest {
  user_id: string;
  target_exam?: string;
  exam_date: string;
  subjects: string[];
  daily_hours: number;
  preparation_weeks: number;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  name: string;
  target_exam: string;
  start_date: string;
  end_date: string;
  daily_hours: number;
  weekly_schedule: any;
  topics_to_cover: string[];
  revision_schedule: any;
  mock_test_dates: string[];
  is_active: boolean;
}

class StudyPlannerService {
  async generateStudyPlan(data: StudyPlanRequest): Promise<StudyPlan> {
    return apiClient.post<StudyPlan>('/curriculum/generate-schedule', data);
  }

  async getActivePlan(userId: string): Promise<StudyPlan | null> {
    return apiClient.get<StudyPlan>(`/study-plans/active?user_id=${userId}`);
  }

  async getTodaySchedule(userId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/study-plans/today?user_id=${userId}`);
  }

  async updatePlanProgress(planId: string, topicId: string): Promise<void> {
    return apiClient.post(`/study-plans/${planId}/progress`, {
      completed_topic_id: topicId
    });
  }
}

export const studyPlannerService = new StudyPlannerService();
