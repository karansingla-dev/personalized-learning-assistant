// frontend/app/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
  Brain, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  CheckCircle,
  Users,
  BarChart,
  FileText,
  Zap,
  Star,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Google Gemini AI analyzes your syllabus and creates personalized study materials tailored to your needs.'
    },
    {
      icon: FileText,
      title: 'Smart Notes Generation',
      description: 'Automatically generate comprehensive notes in multiple formats - bullet points, Cornell, mind maps, and more.'
    },
    {
      icon: Trophy,
      title: 'Interactive Quizzes',
      description: 'Test your knowledge with AI-generated quizzes that adapt to your learning level and progress.'
    },
    {
      icon: BarChart,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics and insights about your performance.'
    },
    {
      icon: Zap,
      title: 'Smart Study Plans',
      description: 'Get personalized study schedules that optimize your learning based on available time and goals.'
    },
    {
      icon: Users,
      title: 'Competitive Exam Prep',
      description: 'Specialized preparation for JEE, NEET, CAT, GATE, UPSC, and other competitive exams.'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'JEE Aspirant',
      content: 'This platform transformed my JEE preparation. The AI-generated notes and quizzes helped me improve my score by 40%!',
      rating: 5
    },
    {
      name: 'Rahul Kumar',
      role: '10th Standard Student',
      content: 'The study plans are amazing! I can balance school work and exam preparation easily now.',
      rating: 5
    },
    {
      name: 'Anita Patel',
      role: 'NEET Aspirant',
      content: 'The topic explanations are so clear and the practice problems really helped me understand complex concepts.',
      rating: 5
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Students' },
    { value: '1M+', label: 'Topics Explained' },
    { value: '95%', label: 'Success Rate' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                Learning Assistant
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#features" className="text-gray-700 hover:text-primary-600 transition">
                Features
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition">
                Testimonials
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-primary-600 transition">
                Pricing
              </a>
              {isSignedIn ? (
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link 
                  href="/auth/sign-in" 
                  className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-6">
            <Sparkles className="h-5 w-5 text-primary-600 mr-2" />
            <span className="text-primary-700 font-medium">AI-Powered Learning Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Learning Journey with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mt-2">
              Personalized AI Assistance
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Upload your syllabus and let our AI create customized study materials, 
            generate practice quizzes, and build the perfect study plan for your success.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isSignedIn ? (
              <Link 
                href="/dashboard" 
                className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium text-lg transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/sign-up" 
                  className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium text-lg transition-all duration-200"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  href="/auth/sign-in" 
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white rounded-lg font-medium text-lg transition-all duration-200"
                >
                  Sign In
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary-200 rounded-full blur-3xl opacity-20"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered tools helps you learn smarter, not harder.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Syllabus</h3>
              <p className="text-gray-600">
                Simply upload your syllabus PDF and our AI will analyze it instantly
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-600">
                Our AI extracts topics, creates notes, and generates personalized content
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Learning</h3>
              <p className="text-gray-600">
                Access your personalized study materials and track your progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Students Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of successful students
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join 50,000+ students who are already learning smarter with AI
          </p>
          {isSignedIn ? (
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link 
              href="/auth/sign-up" 
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Brain className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold text-white">Learning Assistant</span>
            </div>
            <p className="text-sm">
              Your AI-powered learning companion for academic success.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; 2024 Learning Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}