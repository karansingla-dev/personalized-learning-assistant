// frontend/src/app/dashboard/layout.tsx
'use client';

import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Brain, 
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Search,
  Bell,
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const { userId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoaded && !userId) {
      router.push('/auth/sign-in');
    }
  }, [authLoaded, userId, router]);

  // Navigation items for mobile menu or quick access
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      color: 'from-blue-500 to-cyan-400'
    },
    {
      name: 'Syllabus',
      href: '/dashboard/syllabus',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-400'
    },
    {
      name: 'Notes',
      href: '/dashboard/notes',
      icon: FileText,
      color: 'from-green-500 to-emerald-400'
    },
    {
      name: 'AI Tutor',
      href: '/dashboard/ai-tutor',
      icon: Brain,
      color: 'from-orange-500 to-red-400'
    },
    {
      name: 'Study Planner',
      href: '/dashboard/study-planner',
      icon: Calendar,
      color: 'from-indigo-500 to-purple-400'
    },
    {
      name: 'Progress',
      href: '/dashboard/progress',
      icon: BarChart,
      color: 'from-yellow-500 to-orange-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-violet-900/30">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Slim Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left Section - Logo/Home and Quick Nav */}
            <div className="flex items-center space-x-6">
              {/* Logo/Home */}
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LA</span>
                </div>
                <span className="text-white font-semibold hidden sm:block">Learning Assistant</span>
              </Link>

              {/* Quick Navigation Links - Desktop Only */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navItems.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-white/20 text-white' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Center Section - Search Bar */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Search topics, notes, or courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                />
              </div>
            </div>

            {/* Right Section - User Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-all">
                <Bell className="w-5 h-5 text-white/70" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl">
                    <div className="p-4 border-b border-white/10">
                      <p className="text-white font-medium">{user?.fullName || 'User'}</p>
                      <p className="text-white/60 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    
                    <div className="p-2">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center space-x-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      
                      <SignOutButton>
                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </SignOutButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="fixed top-14 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 lg:hidden">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white` 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Search */}
          <div className="p-4 pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Full Width */}
      <main className="pt-14 min-h-screen">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}