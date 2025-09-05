// frontend/src/app/page.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-6000"></div>
        
        {/* Moving gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 opacity-50"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                  LearnSmart
                </span>
                <span className="text-white ml-2">AI</span>
                <span className="inline-block ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full font-bold animate-pulse">
                  BETA
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {isSignedIn ? (
                <>
                  <Link href="/dashboard" className="text-white/80 hover:text-white font-medium transition-all hover:scale-105">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative px-6 py-3 bg-black rounded-lg leading-none flex items-center">
                      <span className="text-white font-semibold">Launch App →</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-in" className="text-white/80 hover:text-white font-medium transition-all hover:scale-105">
                    Sign In
                  </Link>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200 group-hover:animate-pulse"></div>
                    <div className="relative px-6 py-3 bg-black rounded-lg leading-none flex items-center">
                      <span className="text-white font-semibold">Get Started Free</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 pt-32 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Floating badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-full border border-white/20 animate-bounce-slow">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-white text-sm font-medium">🚀 AI-Powered Learning is Live!</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block text-white">Learn</span>
              <span className="block mt-2">
                <span className="inline-block transform hover:scale-110 transition-transform cursor-pointer bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                  10x Faster
                </span>
              </span>
              <span className="block text-white mt-2">with AI</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Upload your syllabus and watch AI transform it into 
              <span className="text-white font-semibold"> personalized lessons</span>, 
              <span className="text-white font-semibold"> smart explanations</span>, and 
              <span className="text-white font-semibold"> interactive quizzes</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-6 justify-center mb-12">
              {isSignedIn ? (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="group relative px-8 py-5 overflow-hidden rounded-2xl bg-white text-black font-bold text-lg transition-all hover:scale-105 transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative group-hover:text-white transition-colors duration-300">
                    Open Dashboard →
                  </span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/sign-up')}
                    className="group relative px-8 py-5 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg transition-all hover:scale-105 transform hover:shadow-2xl hover:shadow-purple-500/25"
                  >
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative group-hover:text-black transition-colors duration-300 flex items-center gap-2">
                      Start Learning Free 
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </button>
                  
                  <button
                    onClick={() => router.push('#demo')}
                    className="px-8 py-5 rounded-2xl bg-white/10 backdrop-blur-xl text-white font-bold text-lg border border-white/20 hover:bg-white/20 transition-all hover:scale-105 transform"
                  >
                    Watch Demo
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 mt-16">
              {[
                { value: '10K+', label: 'Students' },
                { value: '95%', label: 'Success Rate' },
                { value: '4.9★', label: 'Rating' }
              ].map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="text-4xl font-bold text-white group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6">
              Superpowers for
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Students</span>
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to ace your exams
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🧠',
                title: 'AI Brain',
                description: 'Upload any syllabus and get instant AI-generated study materials',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Learn complex topics in minutes with personalized AI explanations',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: '📈',
                title: 'Track Progress',
                description: 'Real-time analytics to monitor your learning journey',
                color: 'from-orange-500 to-red-500'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500`}></div>
                
                {/* Card */}
                <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Hover arrow */}
                  <div className="mt-4 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span>Learn more</span>
                    <span className="group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-25 group-hover:opacity-50 transition duration-500"></div>
            
            {/* Demo Card */}
            <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-bold mb-4">
                  LIVE DEMO
                </span>
                <h2 className="text-4xl font-black text-white mb-4">
                  See the Magic in Action
                </h2>
                <p className="text-gray-400 text-lg">
                  Watch how AI transforms your learning in seconds
                </p>
              </div>

              {/* Demo Animation */}
              <div className="bg-black/50 rounded-2xl p-8 border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-white">Upload Syllabus</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div className="flex-1 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse animation-delay-200"></div>
                    <span className="text-white">AI Analysis</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div className="flex-1 h-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse animation-delay-400"></div>
                    <span className="text-white">Start Learning!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-8">
            Ready to become a
            <span className="block mt-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Learning Machine?
            </span>
          </h2>
          <p className="text-2xl text-gray-300 mb-12">
            Join thousands of students achieving their dreams
          </p>
          
          {!isSignedIn && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => router.push('/auth/sign-up')}
                className="group relative px-12 py-6 overflow-hidden rounded-2xl font-bold text-xl transition-all hover:scale-105 transform"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-gradient"></div>
                <span className="relative text-black">
                  Start Free Trial →
                </span>
              </button>
              
              <div className="text-gray-400">
                No credit card required • Free forever
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">LearnSmart AI</h3>
              <p className="text-gray-400">© 2024 All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              {['Twitter', 'Discord', 'GitHub'].map((social) => (
                <button
                  key={social}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
      `}</style>
    </div>
  );
}