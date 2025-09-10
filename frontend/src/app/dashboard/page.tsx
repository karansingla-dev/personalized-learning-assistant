// frontend/src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
  Brain, 
  Trophy,
  Target,
  TrendingUp,
  Award,
  Flame,
  Book,
  Calculator,
  FileText,
  Download,
  Atom,
  Globe,
  Calendar,
  Clock,
  Star,
  Zap,
  Sparkles,
  ChevronRight,
  Play,
  BarChart,
  Users,
  Rocket,
  Heart,
  Shield,
  CloudLightning,
  Gamepad2,
  Medal,
  Crown,
  Gem,
  BookOpen,
  GraduationCap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Interfaces
interface DashboardData {
  user_info: {
    name: string;
    email: string;
    class_level: number;
    board: string;
    stream?: string;
    current_streak: number;
    total_points: number;
    level: number;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    icon: string;
    total_topics: number;
    completed_topics: number;
    progress_percentage: number;
    last_studied?: string;
    next_topic?: string;
    color: string;
    current_streak?: number;
  }>;
  study_stats: {
    total_hours_this_week: number;
    hours_change: number;
    average_daily_hours: number;
    topics_completed_this_week: number;
    topics_change: number;
    weekly_goal_progress: number;
    goal_change: number;
    quiz_accuracy: number;
    accuracy_change: number;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    subject?: string;
    timestamp: string;
    score?: number;
  }>;
  achievements?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
  }>;
  quick_actions: Array<{
    label: string;
    action: string;
    enabled?: boolean;
  }>;
}

// Subject card component
const SubjectCard = ({ subject, router }: { subject: any; router: any }) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      router.push(`/dashboard/subjects/${subject.id}`);
      return;
    }
    router.push(`/dashboard/subjects/${subject.id}`);
  };

  // Get gradient colors based on subject
  const getSubjectColors = (name: string) => {
    const colorMap: { [key: string]: { gradient: string; bg: string } } = {
      'Physics': { gradient: 'from-blue-400 to-cyan-400', bg: 'from-blue-500 to-cyan-500' },
      'Mathematics': { gradient: 'from-purple-400 to-pink-400', bg: 'from-purple-500 to-pink-500' },
      'Chemistry': { gradient: 'from-green-400 to-emerald-400', bg: 'from-green-500 to-emerald-500' },
      'Biology': { gradient: 'from-orange-400 to-red-400', bg: 'from-orange-500 to-red-500' },
      'Computer Science': { gradient: 'from-indigo-400 to-blue-400', bg: 'from-indigo-500 to-blue-500' },
      'English': { gradient: 'from-pink-400 to-rose-400', bg: 'from-pink-500 to-rose-500' },
      'History': { gradient: 'from-amber-400 to-yellow-400', bg: 'from-amber-500 to-yellow-500' },
      'Geography': { gradient: 'from-teal-400 to-green-400', bg: 'from-teal-500 to-green-500' },
    };
    return colorMap[name] || { gradient: 'from-gray-400 to-gray-500', bg: 'from-gray-500 to-gray-600' };
  };

  const colors = getSubjectColors(subject.name);
  const progressPercentage = subject.progress_percentage || 0;
  const completedTopics = subject.completed_topics || 0;
  const totalTopics = subject.total_topics || 1;
  const currentStreak = subject.current_streak || 0;

  return (
    <div 
      onClick={handleCardClick}
      className="glass-effect rounded-2xl p-6 hover-lift cursor-pointer transition-all hover:border-white/30 group hover:bg-white/15"
      title={`View ${subject.name} topics`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
          <div className="text-2xl">{subject.icon || '📚'}</div>
        </div>
        <div className="flex items-center space-x-2">
          {currentStreak > 0 && (
            <div className="flex items-center bg-orange-500/20 px-2 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-400 mr-1" />
              <span className="text-xs text-orange-300 font-bold">{currentStreak}</span>
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-all group-hover:translate-x-1" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{subject.name}</h3>
      <p className="text-gray-400 text-sm mb-4">
        {completedTopics}/{totalTopics} topics completed
      </p>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-bold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-1000`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {subject.next_topic ? `Next: ${subject.next_topic}` : 'Get started'}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/subjects/${subject.id}`);
          }}
          className={`px-3 py-1 bg-gradient-to-r ${colors.bg} text-white text-xs rounded-full hover:opacity-80 transition hover:scale-105`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

const StatsCard = ({ icon, label, value, change, color }: any) => {
  const isPositive = change >= 0;
  
  return (
    <div className="glass-effect rounded-2xl p-4 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className={`flex items-center text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

const ActivityItem = ({ activity }: { activity: any }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'started': return <Play className="w-4 h-4 text-blue-400" />;
      case 'quiz': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'achievement': return <Award className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
      <div className="flex items-center space-x-3">
        {getActivityIcon(activity.type)}
        <div>
          <p className="text-sm text-white">{activity.title}</p>
          {activity.subject && (
            <p className="text-xs text-gray-400">{activity.subject}</p>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Morning');
    else if (hour < 17) setTimeOfDay('Afternoon');
    else setTimeOfDay('Evening');
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/dashboard?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-effect rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Something went wrong'}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user_info, subjects, study_stats, recent_activity } = dashboardData;

  // Stats data
  const stats = [
    { 
      icon: <TrendingUp className="w-5 h-5" />, 
      label: 'Study Streak', 
      value: `${user_info.current_streak} days`, 
      change: study_stats.hours_change, 
      color: 'from-orange-500 to-red-500' 
    },
    { 
      icon: <Clock className="w-5 h-5" />, 
      label: 'Hours This Week', 
      value: study_stats.total_hours_this_week.toFixed(1), 
      change: study_stats.hours_change, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      icon: <Trophy className="w-5 h-5" />, 
      label: 'Total Points', 
      value: user_info.total_points.toLocaleString(), 
      change: study_stats.topics_change, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      icon: <Target className="w-5 h-5" />, 
      label: 'Weekly Goal', 
      value: `${Math.round(study_stats.weekly_goal_progress)}%`, 
      change: study_stats.goal_change, 
      color: 'from-green-500 to-emerald-500' 
    }
  ];

  // Glass effect styles
  const glassEffect = "bg-white/10 backdrop-blur-xl border border-white/20";
  const glassEffectStrong = "bg-black/40 backdrop-blur-xl border border-white/10";

  return (
    <div className="min-h-screen">
      {/* Add the style tag for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.5s ease-out;
        }
        
        .slide-in-up {
          animation: slideInUp 0.5s ease-out;
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .hover-lift {
          transition: all 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-effect-strong {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 slide-in-left">
          <div className="glass-effect-strong rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                  Good {timeOfDay}, {user_info.name}! 
                  <Sparkles className="w-8 h-8 ml-3 text-yellow-400 float-animation" />
                </h1>
                <p className="text-gray-300 text-lg">
                  You're on a <span className="text-orange-400 font-bold">{user_info.current_streak}-day streak!</span> Keep it up!
                </p>
                <div className="flex items-center mt-4 space-x-4">
                  <div className="flex items-center">
                    <Flame className="w-5 h-5 text-orange-400 mr-2" />
                    <span className="text-white font-semibold">{user_info.total_points.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                    <span className="text-white font-semibold">Level {user_info.level}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-white font-semibold">Class {user_info.class_level}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    if (subjects.length > 0 && subjects[0].next_topic) {
                      router.push(`/dashboard/subjects/${subjects[0].id}`);
                    } else {
                      router.push('/dashboard/study');
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl transition transform hover:scale-105"
                >
                  Continue Learning
                </button>
                <button 
                  onClick={() => router.push('/dashboard/quiz')}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  Solve Quiz
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 slide-in-up">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
            Quick Actions
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Quiz Card */}
            <div 
              onClick={() => router.push('/dashboard/quiz')}
              className="glass-effect rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Practice Quiz</h3>
                <p className="text-white/60 text-sm mb-4">
                  Test your knowledge with AI-generated quizzes
                </p>
                <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition">
                  Start Quiz →
                </button>
              </div>
            </div>

            {/* QUESTION SOLVER CARD - NEW! */}
            <div 
              onClick={() => router.push('/dashboard/question-solver')}
              className="glass-effect rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                    <Calculator className="w-7 h-7 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold animate-pulse">
                    NEW
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Question Solver</h3>
                <p className="text-white/60 text-sm mb-4">
                  Upload homework and get instant AI solutions
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-white/80 text-xs">
                    <FileText className="w-3 h-3 mr-2 text-green-400" />
                    <span>PDF, Word, Images</span>
                  </div>
                  <div className="flex items-center text-white/80 text-xs">
                    <Zap className="w-3 h-3 mr-2 text-yellow-400" />
                    <span>Step-by-step solutions</span>
                  </div>
                  <div className="flex items-center text-white/80 text-xs">
                    <Download className="w-3 h-3 mr-2 text-blue-400" />
                    <span>Download as PDF</span>
                  </div>
                </div>
                <button className="w-full py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition">
                  Solve Questions →
                </button>
              </div>
            </div>

            {/* AI Tutor Card */}
            <div 
              onClick={() => router.push('/dashboard/ai-tutor')}
              className="glass-effect rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Tutor</h3>
                <p className="text-white/60 text-sm mb-4">
                  Get personalized learning assistance from AI
                </p>
                <button className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition">
                  Start Learning →
                </button>
              </div>
            </div>
            
          </div>
        </div>


        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subjects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-blue-400" />
                  Your Subjects
                </h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={fetchDashboardData}
                    className="p-2 text-gray-400 hover:text-white transition hover:bg-white/10 rounded-lg"
                    title="Refresh dashboard"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No subjects found</p>
                  <button 
                    onClick={() => router.push('/dashboard/syllabus')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    Upload Syllabus
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} router={router} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Activity & Insights */}
          <div className="space-y-6">
            {/* Study Insights */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-400" />
                Study Insights
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Daily Average</span>
                  <span className="text-white font-semibold">
                    {study_stats.average_daily_hours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Topics This Week</span>
                  <span className="text-white font-semibold">
                    {study_stats.topics_completed_this_week}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Quiz Accuracy</span>
                  <span className="text-white font-semibold">
                    {Math.round(study_stats.quiz_accuracy)}%
                  </span>
                </div>
                
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Weekly Goal Progress</p>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${study_stats.weekly_goal_progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Recent Activity
              </h3>
              
              <div className="space-y-3">
                {recent_activity.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  recent_activity.slice(0, 5).map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))
                )}
              </div>
              
              {recent_activity.length > 5 && (
                <button 
                  onClick={() => router.push('/dashboard/activity')}
                  className="w-full mt-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition text-sm"
                >
                  View All Activity
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}