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

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Learning Assistant</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
              >
                Profile
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
              >
                Settings
              </button>
              <SignOutButton>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  Sign Out
                </button>
              </SignOutButton>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      {stat.unit && <span className="text-lg text-gray-600 ml-1">{stat.unit}</span>}
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
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Topics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Topics</h3>
            <div className="space-y-3">
              {['Calculus Basics', 'Linear Algebra', 'Probability Theory'].map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{topic}</p>
                      <p className="text-sm text-gray-600">Last studied 2 days ago</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/topics/${index + 1}`)}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Tasks</h3>
            <div className="space-y-3">
              {[
                { task: 'Complete Chapter 5 Quiz', due: 'Due in 2 days', type: 'quiz' },
                { task: 'Review Integration Topics', due: 'Due tomorrow', type: 'review' },
                { task: 'Practice Problems Set 3', due: 'Due in 4 days', type: 'practice' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === 'quiz' ? 'bg-blue-100' :
                      item.type === 'review' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {item.type === 'quiz' ? '📝' :
                       item.type === 'review' ? '👁️' : '💪'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.task}</p>
                      <p className="text-sm text-gray-600">{item.due}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => console.log('Start task:', item.task)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
                  >
                    Start →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Tip of the Day */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">💡 Study Tip of the Day</h3>
          <p className="text-white/90">
            Use the Pomodoro Technique: Study for 25 minutes, then take a 5-minute break. 
            After 4 sessions, take a longer 15-30 minute break. This helps maintain focus and prevents burnout!
          </p>
        </div>
      </main>
    </div>
  );
}