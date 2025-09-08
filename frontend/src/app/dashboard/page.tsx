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
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  CheckCircle
} from 'lucide-react';

// Animation styles
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.5), 0 0 60px rgba(147, 51, 234, 0.3); }
    50% { box-shadow: 0 0 40px rgba(147, 51, 234, 0.8), 0 0 80px rgba(147, 51, 234, 0.5); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
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
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .float-animation {
    animation: float 6s ease-in-out infinite;
  }
  
  .glow-animation {
    animation: glow 3s ease-in-out infinite;
  }
  
  .pulse-animation {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .slide-in-left {
    animation: slideInLeft 0.6s ease-out;
  }
  
  .slide-in-right {
    animation: slideInRight 0.6s ease-out;
  }
  
  .slide-in-up {
    animation: slideInUp 0.6s ease-out;
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  
  .stagger-animation {
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .glass-effect-strong {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .gradient-border {
    position: relative;
    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  .neon-text {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
  }
  
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  .card-shine {
    position: relative;
    overflow: hidden;
  }
  
  .card-shine::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
    transform: rotate(45deg);
    transition: all 0.5s;
    opacity: 0;
  }
  
  .card-shine:hover::after {
    animation: shimmer 0.5s ease-out;
    opacity: 1;
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .bounce-in {
    animation: bounceIn 0.6s ease-out;
  }
`;

// Mock data - replace with real data
const mockSubjects = [
  { 
    id: '1', 
    name: 'Mathematics', 
    icon: <Calculator className="w-6 h-6" />, 
    color: 'from-blue-500 to-purple-500',
    bgColor: 'from-blue-500/20 to-purple-500/20',
    progress: 75,
    topics: 12,
    completedTopics: 9,
    nextTopic: 'Calculus',
    streak: 5
  },
  { 
    id: '2', 
    name: 'Physics', 
    icon: <Atom className="w-6 h-6" />, 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/20 to-pink-500/20',
    progress: 60,
    topics: 10,
    completedTopics: 6,
    nextTopic: 'Quantum Mechanics',
    streak: 3
  },
  { 
    id: '3', 
    name: 'Chemistry', 
    icon: <Zap className="w-6 h-6" />, 
    color: 'from-green-500 to-teal-500',
    bgColor: 'from-green-500/20 to-teal-500/20',
    progress: 85,
    topics: 8,
    completedTopics: 7,
    nextTopic: 'Organic Chemistry',
    streak: 7
  },
  { 
    id: '4', 
    name: 'Biology', 
    icon: <Heart className="w-6 h-6" />, 
    color: 'from-red-500 to-orange-500',
    bgColor: 'from-red-500/20 to-orange-500/20',
    progress: 45,
    topics: 15,
    completedTopics: 7,
    nextTopic: 'Cell Biology',
    streak: 2
  }
];

const achievements = [
  { id: 1, name: 'Quick Learner', icon: <Rocket className="w-8 h-8" />, color: 'from-blue-500 to-purple-500', unlocked: true },
  { id: 2, name: 'Problem Solver', icon: <Trophy className="w-8 h-8" />, color: 'from-yellow-500 to-orange-500', unlocked: true },
  { id: 3, name: 'Perfectionist', icon: <Crown className="w-8 h-8" />, color: 'from-purple-500 to-pink-500', unlocked: false },
  { id: 4, name: 'Speed Master', icon: <CloudLightning className="w-8 h-8" />, color: 'from-green-500 to-teal-500', unlocked: false }
];

const recentActivities = [
  { id: 1, action: 'Completed', topic: 'Quadratic Equations', time: '2 hours ago', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
  { id: 2, action: 'Started', topic: 'Thermodynamics', time: '5 hours ago', icon: <Play className="w-4 h-4" />, color: 'text-blue-400' },
  { id: 3, action: 'Achieved 100%', topic: 'Organic Chemistry', time: '1 day ago', icon: <Trophy className="w-4 h-4" />, color: 'text-yellow-400' },
  { id: 4, action: 'Reviewed', topic: 'Calculus', time: '2 days ago', icon: <BookOpen className="w-4 h-4" />, color: 'text-purple-400' }
];

// Components
const SubjectCard = ({ subject, index }: { subject: any, index: number }) => {
  const router = useRouter();
  
  return (
    <div 
      className="gradient-border rounded-2xl p-6 hover-lift card-shine cursor-pointer fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-white shadow-lg`}>
          {subject.icon}
        </div>
        <div className="flex items-center space-x-2">
          {subject.streak > 0 && (
            <div className="flex items-center bg-orange-500/20 px-2 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-400 mr-1" />
              <span className="text-xs text-orange-300 font-bold">{subject.streak}</span>
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{subject.name}</h3>
      <p className="text-gray-400 text-sm mb-4">
        {subject.completedTopics}/{subject.topics} topics completed
      </p>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-bold">{subject.progress}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${subject.color} rounded-full transition-all duration-1000`}
            style={{ width: `${subject.progress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Next: {subject.nextTopic}</span>
        <button className={`px-3 py-1 bg-gradient-to-r ${subject.bgColor} text-white text-xs rounded-full hover:opacity-80 transition`}>
          Continue
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

const AchievementBadge = ({ achievement, index }: any) => {
  return (
    <div 
      className={`flex flex-col items-center p-4 rounded-2xl ${
        achievement.unlocked ? 'glass-effect' : 'glass-effect opacity-50'
      } hover-lift bounce-in`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center text-white mb-2 ${
        achievement.unlocked ? 'glow-animation' : ''
      }`}>
        {achievement.icon}
      </div>
      <p className="text-xs text-white font-medium text-center">{achievement.name}</p>
      {!achievement.unlocked && (
        <div className="mt-2 w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gray-600 to-gray-500 rounded-full" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Morning');
    else if (hour < 17) setTimeOfDay('Afternoon');
    else setTimeOfDay('Evening');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-96 h-96 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${10 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 glass-effect-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Greeting */}
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-gray-400 text-sm">Good {timeOfDay},</p>
                  <p className="text-white font-bold">{user?.firstName || 'Student'} 👋</p>
                </div>
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search topics, formulas, or concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
              
              {/* Profile */}
              <button 
                onClick={() => router.push('/dashboard/profile')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transition"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.firstName?.[0]?.toUpperCase() || 'S'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-white hidden sm:block" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 slide-in-up">
            <div className="px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 slide-in-left">
          <div className="glass-effect-strong rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                  Welcome back, {user?.firstName}! 
                  <Sparkles className="w-8 h-8 ml-3 text-yellow-400 float-animation" />
                </h1>
                <p className="text-gray-300 text-lg">
                  You're on a <span className="text-orange-400 font-bold">7-day streak!</span> Keep it up! 🔥
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <button 
                    onClick={() => router.push('/dashboard/study')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition flex items-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Continue Learning
                  </button>
                  <button className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">
                    View Schedule
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center glow-animation">
                  <Trophy className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Level 12
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            icon={<TrendingUp className="w-5 h-5" />}
            label="Study Time Today"
            value="3.5h"
            change={12}
            color="from-blue-500 to-purple-500"
          />
          <StatsCard 
            icon={<Target className="w-5 h-5" />}
            label="Topics Completed"
            value="28"
            change={8}
            color="from-green-500 to-teal-500"
          />
          <StatsCard 
            icon={<Award className="w-5 h-5" />}
            label="Current Rank"
            value="#42"
            change={-5}
            color="from-purple-500 to-pink-500"
          />
          <StatsCard 
            icon={<Zap className="w-5 h-5" />}
            label="XP Points"
            value="1,847"
            change={15}
            color="from-orange-500 to-red-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subjects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subjects Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Book className="w-6 h-6 mr-3 text-purple-400" />
                  Your Subjects
                </h2>
                <button className="text-purple-400 hover:text-purple-300 transition flex items-center text-sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockSubjects.map((subject, index) => (
                  <SubjectCard key={subject.id} subject={subject} index={index} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-blue-400" />
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 transition group">
                  <Calculator className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition" />
                  <p className="text-xs text-gray-300">Practice</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl hover:from-green-500/30 hover:to-teal-500/30 transition group">
                  <BookOpen className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition" />
                  <p className="text-xs text-gray-300">Study</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition group">
                  <Trophy className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition" />
                  <p className="text-xs text-gray-300">Quiz</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl hover:from-orange-500/30 hover:to-red-500/30 transition group">
                  <BarChart className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition" />
                  <p className="text-xs text-gray-300">Progress</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Medal className="w-5 h-5 mr-2 text-yellow-400" />
                Achievements
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement, index) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
                ))}
              </div>
              
              <button className="w-full mt-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition text-sm">
                View All Achievements
              </button>
            </div>

            {/* Recent Activity */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-400" />
                Recent Activity
              </h3>
              
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ${activity.color}`}>
                        {activity.icon}
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          {activity.action} <span className="font-bold">{activity.topic}</span>
                        </p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Goals */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-400" />
                Today's Goals
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-green-400 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-sm text-gray-300">Complete 3 topics</span>
                  </div>
                  <span className="text-xs text-green-400">2/3</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-yellow-400" />
                    <span className="text-sm text-gray-300">Study for 4 hours</span>
                  </div>
                  <span className="text-xs text-yellow-400">3.5/4h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                    <span className="text-sm text-gray-300">Score 90% in quiz</span>
                  </div>
                  <span className="text-xs text-gray-400">0/1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mt-8 glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <Crown className="w-6 h-6 mr-3 text-yellow-400" />
              Weekly Leaderboard
            </h3>
            <button className="text-purple-400 hover:text-purple-300 transition flex items-center text-sm">
              View Full Leaderboard
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Top 3 */}
            {[
              { rank: 2, name: 'Sarah K.', points: '2,150', avatar: 'SK', color: 'from-gray-400 to-gray-500' },
              { rank: 1, name: 'Alex M.', points: '2,340', avatar: 'AM', color: 'from-yellow-400 to-orange-500' },
              { rank: 3, name: 'John D.', points: '1,980', avatar: 'JD', color: 'from-orange-600 to-orange-700' }
            ].sort((a, b) => a.rank === 1 ? -1 : a.rank === 2 ? (b.rank === 1 ? 1 : -1) : 1).map((user, index) => (
              <div 
                key={user.rank}
                className={`relative p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition ${
                  user.rank === 1 ? 'transform scale-105' : ''
                }`}
              >
                {user.rank === 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Crown className="w-8 h-8 text-yellow-400 float-animation" />
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mt-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-bold`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.points} XP</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {user.rank}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Your Position */}
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {user?.firstName?.[0]?.toUpperCase() || 'Y'}
                </div>
                <div>
                  <p className="text-white font-bold">Your Position</p>
                  <p className="text-gray-300 text-sm">1,847 XP</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                #42
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}