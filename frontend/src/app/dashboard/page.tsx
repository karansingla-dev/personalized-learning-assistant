// frontend/src/app/dashboard/page.tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface UserStats {
  totalStudyHours: number;
  topicsCompleted: number;
  quizzesTaken: number;
  currentStreak: number;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { userId } = useAuth();
  const router = useRouter();
  
  const [greeting, setGreeting] = useState('');
  const [userStats, setUserStats] = useState<UserStats>({
    totalStudyHours: 0,
    topicsCompleted: 0,
    quizzesTaken: 0,
    currentStreak: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch user stats from backend
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;
      
      try {
        // For now, using mock data - replace with actual API call
        setTimeout(() => {
          setUserStats({
            totalStudyHours: 24,
            topicsCompleted: 8,
            quizzesTaken: 12,
            currentStreak: 5,
          });
          setIsLoadingStats(false);
        }, 1000);
        
        // Actual API call would be:
        // const response = await fetch(`http://localhost:8000/api/v1/users/${userId}/stats`);
        // const data = await response.json();
        // setUserStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setIsLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  const quickActions = [
    {
      title: 'Upload Syllabus',
      description: 'Add new study material',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      color: 'bg-blue-500',
      href: '/dashboard/syllabus',
    },
    {
      title: 'Study Topics',
      description: 'Continue learning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'bg-green-500',
      href: '/dashboard/topics',
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-purple-500',
      href: '/dashboard/quiz',
    },
    {
      title: 'View Progress',
      description: 'Track your growth',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-orange-500',
      href: '/dashboard/progress',
    },
  ];

  const statsCards = [
    {
      label: 'Study Hours',
      value: userStats.totalStudyHours,
      unit: 'hrs',
      icon: '⏱️',
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Topics Completed',
      value: userStats.topicsCompleted,
      unit: '',
      icon: '📚',
      color: 'from-green-400 to-green-600',
    },
    {
      label: 'Quizzes Taken',
      value: userStats.quizzesTaken,
      unit: '',
      icon: '✅',
      color: 'from-purple-400 to-purple-600',
    },
    {
      label: 'Current Streak',
      value: userStats.currentStreak,
      unit: 'days',
      icon: '🔥',
      color: 'from-orange-400 to-orange-600',
    },
  ];

  // Check if user exists
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {greeting}, {user.firstName || user.username || 'Learner'}! 👋
        </h2>
        <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg opacity-10`}></div>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingStats ? (
                  <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    {stat.value}
                    {stat.unit && <span className="text-sm text-gray-500 ml-1">{stat.unit}</span>}
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 text-left group cursor-pointer"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h4 className="font-semibold text-gray-900">{action.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {isLoadingStats ? (
            // Loading skeleton
            [1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-4 p-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))
          ) : (
            // Placeholder for when no activity exists
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Start by uploading your first syllabus</p>
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">🚧</span>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-amber-900">Development in Progress</h3>
            <p className="text-amber-800">
              Full dashboard features including PDF syllabus upload, AI-generated notes with Google Gemini, 
              interactive quizzes, and personalized study plans will be available soon.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">Day 2: PDF Processing</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">Day 2: AI Integration</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">Day 3: Quiz System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}