// frontend/types/index.ts
/**
 * Core TypeScript type definitions for the application
 */

// ============= User Types =============
export interface User {
  id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  dateOfBirth: string;
  phoneNumber: string;
  classLevel: string;
  school: string;
  competitiveExam?: CompetitiveExam;
  competitiveExamOther?: string;
  country: string;
  state: string;
  city: string;
  role: UserRole;
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface UserCreateInput {
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  dateOfBirth: string;
  phoneNumber: string;
  classLevel: string;
  school: string;
  competitiveExam?: CompetitiveExam;
  competitiveExamOther?: string;
  country: string;
  state: string;
  city: string;
}

export interface UserPreferences {
  preferredLanguage: string;
  learningPace: 'slow' | 'medium' | 'fast';
  dailyStudyHours: number;
  notificationEnabled: boolean;
  emailNotifications: boolean;
  studyReminderTime?: string;
}

export interface UserStats {
  totalStudyHours: number;
  topicsCompleted: number;
  quizzesTaken: number;
  averageQuizScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActive?: string;
}

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export enum CompetitiveExam {
  NONE = 'none',
  JEE = 'jee',
  NEET = 'neet',
  CAT = 'cat',
  GATE = 'gate',
  UPSC = 'upsc',
  OTHER = 'other'
}

// ============= Syllabus Types =============
export interface Syllabus {
  id: string;
  userId: string;
  fileName: string;
  fileUrl?: string;
  content: string;
  topics: Topic[];
  uploadedAt: string;
  processedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============= Topic Types =============
export interface Topic {
  id: string;
  name: string;
  description?: string;
  importance: number; // 1-5 scale
  estimatedHours: number;
  prerequisites: string[];
  subtopics: string[];
  syllabusId?: string;
  userId: string;
  progress: number; // 0-100 percentage
  isCompleted: boolean;
  lastStudied?: string;
  createdAt: string;
}

export interface TopicExplanation {
  topic: string;
  definition: string;
  detailedExplanation: string;
  keyConcepts: string[];
  applications: string[];
  misconceptions: string[];
  memoryTips: string[];
  relatedTopics: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

// ============= Quiz Types =============
export interface Quiz {
  id: string;
  topicId: string;
  topicName: string;
  userId: string;
  difficulty: QuizDifficulty;
  questions: Question[];
  totalPoints: number;
  score?: number;
  completedAt?: string;
  timeSpent?: number; // in seconds
  createdAt: string;
}

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  userAnswer?: string | boolean;
  explanation: string;
  points: number;
  keywords?: string[];
}

export enum QuestionType {
  MCQ = 'mcq',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  SHORT_ANSWER = 'short_answer'
}

export enum QuizDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// ============= Notes Types =============
export interface Note {
  id: string;
  topicId: string;
  topicName: string;
  userId: string;
  content: string;
  style: NoteStyle;
  createdAt: string;
  updatedAt: string;
}

export enum NoteStyle {
  BULLET = 'bullet',
  CORNELL = 'cornell',
  MINDMAP = 'mindmap',
  OUTLINE = 'outline'
}

// ============= Study Plan Types =============
export interface StudyPlan {
  id: string;
  userId: string;
  totalDays: number;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  plan: DayPlan[];
  milestones: Milestone[];
  createdAt: string;
  isActive: boolean;
}

export interface DayPlan {
  day: number;
  date: string;
  sessions: StudySession[];
  goals: string[];
  revisionTopics: string[];
  isCompleted: boolean;
}

export interface StudySession {
  time: string;
  duration: number; // in minutes
  topicId: string;
  topicName: string;
  activity: 'study' | 'revision' | 'quiz' | 'practice';
  description: string;
  isCompleted: boolean;
}

export interface Milestone {
  day: number;
  milestone: string;
  isAchieved: boolean;
}

// ============= Progress Types =============
export interface Progress {
  userId: string;
  topicId: string;
  progress: number; // 0-100
  quizScores: number[];
  lastStudied: string;
  totalTimeSpent: number; // in minutes
  notesCreated: number;
  practiceProblemsAttempted: number;
  practiceProblemsCorrect: number;
}

// ============= API Response Types =============
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============= Form Types =============
export interface OnboardingFormData {
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: Date;
  phoneNumber: string;
  classLevel: string;
  school: string;
  competitiveExam: CompetitiveExam;
  competitiveExamOther?: string;
  country: string;
  state: string;
  city: string;
}