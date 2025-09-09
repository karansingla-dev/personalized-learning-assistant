// frontend/src/app/dashboard/layout.tsx
'use client';

import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const { userId, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoaded && !userId) {
      router.push('/auth/sign-in');
    }
  }, [authLoaded, userId, router]);

  // Enhanced navigation items with gradients
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      gradient: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      description: 'Overview & Stats'
    },
    {
      name: 'Syllabus',
      href: '/dashboard/syllabus',
      gradient: 'from-purple-500 to-pink-400',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      description: 'Study Materials'
    },
    {
      name: 'AI Study',
      href: '/dashboard/study',
      gradient: 'from-green-500 to-emerald-400',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      description: 'Smart Learning'
    },
    {
      name: 'Progress',
      href: '/dashboard/progress',
      gradient: 'from-orange-500 to-red-400',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Track Performance'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      gradient: 'from-indigo-500 to-purple-400',
      bgColor: 'bg-gradient-to-r from-indigo-500 to-purple-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      description: 'Your Account'
    },
  ];

  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-white/80 animate-pulse">Initializing AI Learning Environment...</p>
        </div>
      </div>
    );
  }

  if (!user || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-violet-900/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Futuristic Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden relative group p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl blur opacity-50 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AI Learning Hub</h1>
                  <p className="text-xs text-white/60 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    Active Learning Mode
                  </p>
                </div>
              </div>
            </div>

            {/* Center Section - Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search topics, videos, or ask AI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 
                           focus:bg-white/10 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <kbd className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white/60">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <svg className="w-5 h-5 text-white/80 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{notifications}</span>
                  </span>
                )}
              </button>

              {/* User Profile Section */}
              <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="flex items-center justify-end space-x-2 text-xs">
                    <span className="text-yellow-400">⚡ Level 12</span>
                    <span className="text-cyan-400">• 2,450 XP</span>
                  </div>
                </div>
                
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 p-0.5">
                    <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </div>

                {/* Sign Out Button */}
                <SignOutButton>
                  <button className="group relative px-4 py-2 overflow-hidden rounded-lg bg-white/5 border border-white/10 hover:border-red-500/50 transition-all">
                    <span className="relative z-10 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-white/70 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm text-white/70 group-hover:text-red-400 hidden sm:block transition-colors">
                        Exit
                      </span>
                    </span>
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Futuristic Sidebar Navigation */}
      <aside className={`
        fixed top-16 left-0 z-40 h-full w-64 
        bg-black/40 backdrop-blur-xl border-r border-white/10
        transform transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Sidebar Content */}
        <nav className="p-3 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  relative group block p-3 rounded-xl transition-all duration-300
                  ${isActive 
                    ? `${item.bgColor} text-white shadow-lg` 
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                  }
                `}
              >
                {/* Glow Effect */}
                {isActive && (
                  <div className={`absolute inset-0 ${item.bgColor} rounded-xl blur-xl opacity-25`}></div>
                )}
                
                <div className="relative flex items-center space-x-3">
                  <div className={`
                    p-2 rounded-lg transition-all
                    ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}
                  `}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-xs ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - Achievement Card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-xl p-4 border border-white/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/20 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Pro Learner</p>
                  <p className="text-white/60 text-xs">7 day streak! 🔥</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Daily Goal</span>
                  <span className="text-cyan-400 font-semibold">68%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: '68%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`
        pt-16 transition-all duration-300
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64'}
      `}>
        <div className="min-h-[calc(100vh-4rem)] p-6">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Action Button for Mobile */}
      <button className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-2xl flex items-center justify-center group">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 animate-pulse"></div>
      </button>
    </div>
  );
}