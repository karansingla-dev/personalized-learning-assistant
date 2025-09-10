// frontend/src/app/dashboard/quiz/start/page.tsx
// FIXED VERSION - Proper quiz submission and navigation

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Flag,
  Timer,
  Brain,
  Target,
  Award,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface Question {
  question_id: string;
  question_number: number;
  question_text: string;
  options: string[];
  topic_name?: string;
  difficulty?: string;
}

interface QuizData {
  quiz_id: string;
  questions: Question[];
  total_questions: number;
  time_limit_minutes: number;
  passing_score: number;
}

export default function QuizTakingPage() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Load quiz data and generate quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Get quiz configuration from session storage
        const storedData = sessionStorage.getItem('quizData');
        if (!storedData) {
          router.push('/dashboard/quiz');
          return;
        }

        const quizConfig = JSON.parse(storedData);
        
        // Generate quiz from backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/quiz/generate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              subject_id: quizConfig.subject_id,
              subject_name: quizConfig.subject_name,
              topic_ids: quizConfig.topic_ids,
              topic_names: quizConfig.topics.map((t: any) => t.name)
            })
          }
        );

        if (!response.ok) throw new Error('Failed to generate quiz');
        
        const data = await response.json();
        setQuizData(data);
        setTimeLeft(data.time_limit_minutes * 60); // Convert to seconds
        
      } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz. Please try again.');
        router.push('/dashboard/quiz');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadQuiz();
    }
  }, [userId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizData && !isSubmitting) {
      // Auto-submit when time is up
      handleSubmitQuiz();
    }
  }, [timeLeft, isSubmitting, quizData]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (!quizData) return;
    
    const questionId = quizData.questions[currentQuestion].question_id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleFlagToggle = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizData || !userId || isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmissionError(null);
    setShowConfirmSubmit(false);

    try {
      // Calculate time taken
      const totalTime = quizData.time_limit_minutes * 60;
      const timeTaken = Math.ceil((totalTime - timeLeft) / 60); // in minutes

      // Submit quiz to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/quiz/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quiz_id: quizData.quiz_id,
            user_id: userId,
            answers: answers,
            time_taken_minutes: timeTaken
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      
      // Store result in sessionStorage with a flag
      sessionStorage.setItem('quizResult', JSON.stringify(result));
      sessionStorage.setItem('quizResultReady', 'true');
      
      // Small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to results page
      router.push('/dashboard/quiz/results');
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setSubmissionError('Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    if (!quizData) return 'unanswered';
    const questionId = quizData.questions[index].question_id;
    if (answers[questionId] !== undefined) {
      return flaggedQuestions.has(index) ? 'flagged' : 'answered';
    }
    return flaggedQuestions.has(index) ? 'flagged' : 'unanswered';
  };

  const getProgress = () => {
    if (!quizData) return { answered: 0, total: 0, percentage: 0 };
    const answered = Object.keys(answers).length;
    const total = quizData.total_questions;
    const percentage = (answered / total) * 100;
    return { answered, total, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-4">Failed to load quiz</p>
          <button
            onClick={() => router.push('/dashboard/quiz')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Quiz Selection
          </button>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Timer and Progress */}
        <div className="mb-6 glass-effect rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Quiz in Progress</h1>
              <div className={`px-3 py-1 rounded-full ${
                timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              } flex items-center`}>
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white/60">
                Progress: {progress.answered}/{progress.total}
              </div>
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-2xl p-6">
              {/* Question Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-purple-400 font-semibold">
                      Question {currentQuestion + 1} of {quizData.total_questions}
                    </span>
                    {currentQ.difficulty && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        currentQ.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        currentQ.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {currentQ.difficulty}
                      </span>
                    )}
                  </div>
                  {currentQ.topic_name && (
                    <p className="text-white/60 text-sm">Topic: {currentQ.topic_name}</p>
                  )}
                </div>
                
                <button
                  onClick={handleFlagToggle}
                  className={`p-2 rounded-lg transition ${
                    flaggedQuestions.has(currentQuestion)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-semibold text-white mb-6">
                {currentQ.question_text}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      answers[currentQ.question_id] === index
                        ? 'bg-purple-500/30 border-2 border-purple-400 text-white'
                        : 'bg-white/5 border-2 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className={`flex items-center px-4 py-2 rounded-lg transition ${
                    currentQuestion === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Previous
                </button>

                <button
                  onClick={() => setCurrentQuestion(Math.min(quizData.total_questions - 1, currentQuestion + 1))}
                  disabled={currentQuestion === quizData.total_questions - 1}
                  className={`flex items-center px-4 py-2 rounded-lg transition ${
                    currentQuestion === quizData.total_questions - 1
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Question Navigator */}
            <div className="glass-effect rounded-2xl p-4">
              <h3 className="text-lg font-bold text-white mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {quizData.questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition ${
                        currentQuestion === index
                          ? 'ring-2 ring-white'
                          : ''
                      } ${
                        status === 'answered'
                          ? 'bg-green-500/30 text-green-400'
                          : status === 'flagged'
                          ? 'bg-yellow-500/30 text-yellow-400'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500/30 rounded"></div>
                  <span className="text-gray-400">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500/30 rounded"></div>
                  <span className="text-gray-400">Flagged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white/10 rounded"></div>
                  <span className="text-gray-400">Not Answered</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Quiz
                </>
              )}
            </button>

            {/* Error Message */}
            {submissionError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{submissionError}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-effect rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Submit Quiz?</h3>
            
            <div className="space-y-3 mb-6">
              <p className="text-white/80">
                You have answered {progress.answered} out of {progress.total} questions.
              </p>
              
              {progress.answered < progress.total && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ You have {progress.total - progress.answered} unanswered questions.
                  </p>
                </div>
              )}
              
              {flaggedQuestions.size > 0 && (
                <p className="text-yellow-400 text-sm">
                  📌 You have {flaggedQuestions.size} flagged questions.
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}