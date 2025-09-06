'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast';
import SubjectCard from '@/components/dashboard/SubjectCard';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TodaySchedule from '@/components/dashboard/TodaySchedule';

interface DashboardData {
  user: {
    name: string;
    class_level: number;
    board: string;
    study_streak: number;
  };
  stats: {
    total_topics: number;
    topics_completed: number;
    completion_percentage: number;
    average_quiz_score: number;
    total_study_hours: number;
    study_streak_days: number;
  };
  subjects: Array<{
    subject_id: string;
    subject_name: string;
    icon: string;
    color: string;
    total_topics: number;
    completed_topics: number;
    progress_percentage: number;
    next_topic: string | null;
  }>;
  recent_activity: Array<any>;
  today_schedule: any;
  motivational_quote: string;
  quick_actions: Array<any>;
}

export default function DashboardPage() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchDashboardData();
    }
  }, [isLoaded, userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/dashboard?user_id=${userId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showToast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/subjects/${subjectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.firstName || dashboardData.user.name}! 
                {dashboardData.user.study_streak > 0 && (
                  <span className="ml-3">🔥 {dashboardData.user.study_streak} day streak</span>
                )}
              </h1>
              <p className="mt-2 text-blue-100">
                Class {dashboardData.user.class_level} • {dashboardData.user.board} Board
              </p>
              <p className="mt-4 text-lg italic text-blue-50">
                "{dashboardData.motivational_quote}"
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Today</p>
              <p className="text-2xl font-semibold">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Topics"
            value={dashboardData.stats.total_topics}
            subtitle={`${dashboardData.stats.topics_completed} completed`}
            icon="📚"
            color="bg-blue-500"
          />
          <StatsCard
            title="Completion"
            value={`${dashboardData.stats.completion_percentage}%`}
            subtitle="Overall progress"
            icon="📊"
            color="bg-green-500"
          />
          <StatsCard
            title="Quiz Score"
            value={`${dashboardData.stats.average_quiz_score}%`}
            subtitle="Average score"
            icon="🎯"
            color="bg-purple-500"
          />
          <StatsCard
            title="Study Time"
            value={`${dashboardData.stats.total_study_hours}h`}
            subtitle="Total hours"
            icon="⏱️"
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <QuickActions actions={dashboardData.quick_actions} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subjects Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.subjects.map((subject) => (
                <SubjectCard
                  key={subject.subject_id}
                  subject={subject}
                  onClick={() => handleSubjectClick(subject.subject_id)}
                />
              ))}
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            {dashboardData.today_schedule && (
              <TodaySchedule schedule={dashboardData.today_schedule} />
            )}
            
            {/* Recent Activity */}
            {dashboardData.recent_activity.length > 0 && (
              <RecentActivity activities={dashboardData.recent_activity} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
