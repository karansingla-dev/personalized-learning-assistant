// frontend/src/app/page.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('mathematics');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Sarah Chen",
      grade: "12th Grade",
      score: "95%",
      image: "👩‍🎓",
      text: "From failing to top of my class! The AI explanations are better than any tutor I've had.",
      improvement: "+45%"
    },
    {
      name: "Rahul Kumar", 
      grade: "JEE Aspirant",
      score: "AIR 127",
      image: "👨‍🎓",
      text: "Cracked JEE Advanced using this app. The personalized study plan was a game-changer!",
      improvement: "+60%"
    },
    {
      name: "Emily Johnson",
      grade: "11th Grade", 
      score: "4.0 GPA",
      image: "👩‍💻",
      text: "I finally understand physics! The AI breaks down complex topics so simply.",
      improvement: "+38%"
    }
  ];

  const subjects = {
    mathematics: { icon: "🔢", topics: ["Calculus", "Algebra", "Geometry", "Statistics"] },
    physics: { icon: "⚛️", topics: ["Mechanics", "Thermodynamics", "Optics", "Quantum"] },
    chemistry: { icon: "🧪", topics: ["Organic", "Inorganic", "Physical", "Analytical"] },
    biology: { icon: "🧬", topics: ["Cell Biology", "Genetics", "Ecology", "Anatomy"] },
    computer: { icon: "💻", topics: ["Programming", "Algorithms", "Data Structures", "AI/ML"] }
  };

  const faqs = [
    {
      question: "Is it really free?",
      answer: "Yes! Basic plan is 100% free forever. Upload unlimited syllabi and get AI-powered explanations. No credit card required."
    },
    {
      question: "How does the AI understand my syllabus?",
      answer: "Our AI is trained on millions of educational documents. It analyzes your syllabus, identifies key topics, and creates personalized learning paths instantly."
    },
    {
      question: "Can it help with competitive exams?",
      answer: "Absolutely! We have specialized modules for JEE, NEET, SAT, CAT, and more. The AI adapts to exam patterns and provides targeted practice."
    },
    {
      question: "How fast can I see results?",
      answer: "Most students see improvement within 2 weeks. Our AI tracks your progress and continuously optimizes your learning path for maximum efficiency."
    }
  ];

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
                left: `${(i * 5) % 100}%`,
                top: `${(i * 7) % 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${15 + i}s`
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
              <span className="text-white text-sm font-medium">🎯 10,000+ Students Already Learning!</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block text-white">From</span>
              <span className="block mt-2">
                <span className="inline-block transform hover:scale-110 transition-transform cursor-pointer bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent line-through opacity-75">
                  Failing
                </span>
              </span>
              <span className="block text-white mt-2">to</span>
              <span className="block mt-2">
                <span className="inline-block transform hover:scale-110 transition-transform cursor-pointer bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent animate-gradient text-7xl sm:text-8xl">
                  Top 1%
                </span>
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI that understands YOU. Upload any syllabus and get
              <span className="text-white font-semibold"> instant personalized tutoring</span> that 
              <span className="text-white font-semibold"> guarantees results</span>
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
                      Start Free - No Card Required
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </button>
                  
                  <button
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-5 rounded-2xl bg-white/10 backdrop-blur-xl text-white font-bold text-lg border border-white/20 hover:bg-white/20 transition-all hover:scale-105 transform"
                  >
                    See How It Works
                  </button>
                </>
              )}
            </div>

            {/* Live Stats Ticker */}
            <div className="flex justify-center gap-12 mt-16">
              {[
                { value: '10,247', label: 'Active Students', change: '+127 today' },
                { value: '95.8%', label: 'Success Rate', change: '↑ 2.3%' },
                { value: '4.9★', label: 'App Rating', change: '2,847 reviews' }
              ].map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="text-4xl font-bold text-white group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                  <div className="text-green-400 text-xs mt-1 opacity-75">{stat.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section - NEW */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Problem Side */}
            <div className="text-left">
              <h2 className="text-4xl font-black text-white mb-8">
                <span className="text-red-500">87% of students</span> struggle with these problems:
              </h2>
              <div className="space-y-4">
                {[
                  "😰 Can't understand complex topics from textbooks",
                  "😴 Boring lectures that don't stick",
                  "📚 Too much to study, too little time",
                  "❌ No personalized help when stuck",
                  "📉 Falling grades despite hard work"
                ].map((problem, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300 text-lg">
                    <span className="text-2xl">{problem}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution Side */}
            <div className="text-left">
              <h2 className="text-4xl font-black text-white mb-8">
                <span className="text-green-500">LearnSmart AI</span> solves everything:
              </h2>
              <div className="space-y-4">
                {[
                  "🎯 AI explains like your smartest friend would",
                  "🚀 Learn 10x faster with visual explanations",
                  "🧠 Personalized path based on YOUR pace",
                  "💡 24/7 AI tutor that never gets tired",
                  "📈 Guaranteed grade improvement in 30 days"
                ].map((solution, i) => (
                  <div key={i} className="flex items-center gap-3 text-white text-lg group hover:translate-x-2 transition-transform cursor-pointer">
                    <span className="text-2xl">{solution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Success Stories - NEW */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Real Students.
              <span className="bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent"> Real Results.</span>
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands who transformed their grades
            </p>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    activeTestimonial === index ? 'block' : 'hidden'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <div className="text-6xl">{testimonial.image}</div>
                    <div className="flex-1">
                      <p className="text-2xl text-white mb-6 italic">"{testimonial.text}"</p>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-white font-bold">{testimonial.name}</p>
                          <p className="text-gray-400">{testimonial.grade}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-green-400">{testimonial.improvement}</span>
                          <span className="text-gray-400">improvement</span>
                        </div>
                        <div className="ml-auto">
                          <span className="text-yellow-400 text-2xl font-bold">{testimonial.score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Carousel Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeTestimonial === i ? 'w-8 bg-white' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual - NEW */}
      <section id="how-it-works" className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Start Learning in
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> 60 Seconds</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload Syllabus",
                description: "Drop any PDF, image, or text file",
                icon: "📤",
                time: "10 seconds"
              },
              {
                step: "2", 
                title: "AI Magic Happens",
                description: "Our AI analyzes and creates your personalized curriculum",
                icon: "🤖",
                time: "30 seconds"
              },
              {
                step: "3",
                title: "Start Learning!",
                description: "Get instant explanations, quizzes, and study plans",
                icon: "🚀",
                time: "20 seconds"
              }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center hover:scale-105 transition-transform">
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <div className="text-5xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 mb-4">{item.description}</p>
                  <span className="text-green-400 text-sm font-bold">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subject Coverage - Interactive - NEW */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Master Any
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Subject</span>
            </h2>
            <p className="text-xl text-gray-400">Click to explore what you can learn</p>
          </div>

          {/* Subject Selector */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            {Object.entries(subjects).map(([key, subject]) => (
              <button
                key={key}
                onClick={() => setSelectedSubject(key)}
                className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  selectedSubject === key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-2xl mr-2">{subject.icon}</span>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          {/* Topics Display */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6">
                Topics we cover in {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}:
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {subjects[selectedSubject as keyof typeof subjects].topics.map((topic, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-white/10 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <span className="text-white font-semibold">{topic}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-400 mt-6">
                + 100s more topics with detailed explanations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
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
              },
              {
                icon: '🎯',
                title: 'Smart Quizzes',
                description: 'AI-generated practice tests that adapt to your level',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: '📱',
                title: 'Study Anywhere',
                description: 'Mobile-friendly platform to learn on the go',
                color: 'from-indigo-500 to-purple-500'
              },
              {
                icon: '🏆',
                title: 'Gamified Learning',
                description: 'Earn points, badges, and compete with friends',
                color: 'from-yellow-500 to-orange-500'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative"
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500`}></div>
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

      {/* Pricing - Emphasize FREE - NEW */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-900/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Start FREE.
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> Stay FREE.</span>
            </h2>
            <p className="text-xl text-gray-400">No credit card. No tricks. Just learning.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-gray-900 rounded-3xl p-8 border-2 border-green-500">
                <div className="text-center mb-8">
                  <span className="text-green-400 font-bold text-sm">MOST POPULAR</span>
                  <h3 className="text-3xl font-bold text-white mt-2">Free Forever</h3>
                  <div className="mt-4">
                    <span className="text-5xl font-black text-white">₹0</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "✅ Unlimited syllabus uploads",
                    "✅ AI explanations for any topic",
                    "✅ Basic quizzes & tests",
                    "✅ Progress tracking",
                    "✅ Mobile app access"
                  ].map((item, i) => (
                    <li key={i} className="text-white">{item}</li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/auth/sign-up')}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  Start Learning Free
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative">
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="text-center mb-8">
                  <span className="text-purple-400 font-bold text-sm">FOR SERIOUS LEARNERS</span>
                  <h3 className="text-3xl font-bold text-white mt-2">Pro</h3>
                  <div className="mt-4">
                    <span className="text-5xl font-black text-white">₹99</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "✨ Everything in Free",
                    "✨ Advanced AI tutor",
                    "✨ Unlimited practice tests",
                    "✨ Exam preparation mode",
                    "✨ Priority support",
                    "✨ Certificates on completion"
                  ].map((item, i) => (
                    <li key={i} className="text-gray-300">{item}</li>
                  ))}
                </ul>
                <button className="w-full py-4 bg-gray-800 text-gray-400 rounded-xl font-bold cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - NEW */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Questions?
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> We've Got Answers</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl text-white font-semibold">{faq.question}</span>
                  <span className={`text-3xl text-white transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div className={`px-8 overflow-hidden transition-all ${openFaq === i ? 'py-6' : 'max-h-0'}`}>
                  <p className="text-gray-300 text-lg">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Enhanced */}
      <section className="relative z-40 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
              <h2 className="text-5xl sm:text-6xl font-black text-white mb-8">
                Your Future is Waiting
                <span className="block mt-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Don't Let it Wait
                </span>
              </h2>
              <p className="text-2xl text-gray-300 mb-12">
                Join 10,000+ students already transforming their grades
              </p>
              
              {!isSignedIn && (
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button
                    onClick={() => router.push('/auth/sign-up')}
                    className="group relative px-12 py-6 overflow-hidden rounded-2xl font-bold text-xl transition-all hover:scale-105 transform"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-gradient"></div>
                    <span className="relative text-black flex items-center gap-2">
                      Start Free Now
                      <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </span>
                  </button>
                  
                  <div className="text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> No credit card
                      <span className="text-green-400">✓</span> Free forever
                      <span className="text-green-400">✓</span> Cancel anytime
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="relative z-40 border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">LearnSmart AI</h3>
              <p className="text-gray-400">AI-powered learning for the next generation</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                {['📧', '🐦', '💬', '📱'].map((icon, i) => (
                  <button
                    key={i}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-400">© 2024 LearnSmart AI. All rights reserved.</p>
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