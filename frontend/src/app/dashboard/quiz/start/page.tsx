// frontend/src/app/dashboard/quiz/start/page.tsx
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
  TrendingUp
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

    loadQuiz();
  }, [userId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || !quizData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit when time is up
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const timeTaken = quizData ? Math.ceil((quizData.time_limit_minutes * 60 - timeLeft) / 60) : 0;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/quiz/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quiz_id: quizData?.quiz_id,
            user_id: userId,
            answers: answers,
            time_taken_minutes: timeTaken
          })
        }
      );

      if (!response.ok) throw new Error('Failed to submit quiz');
      
      const result = await response.json();
      
      // Store result in session storage for results page
      sessionStorage.setItem('quizResult', JSON.stringify(result));
      
      // Navigate to results page
      router.push('/dashboard/quiz/results');
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getQuestionStatus = (index: number) => {
    const question = quizData?.questions[index];
    if (!question) return 'unanswered';
    
    const isAnswered = answers[question.question_id] !== undefined;
    const isFlagged = flaggedQuestions.has(index);
    
    if (isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  const answeredCount = quizData ? Object.keys(answers).length : 0;
  const unansweredCount = quizData ? quizData.total_questions - answeredCount : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white/60">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">No quiz data found</p>
          <button
            onClick={() => router.push('/dashboard/quiz')}
            className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Timer */}
        <div className="glass-effect rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">Quiz in Progress</h1>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-400">{answeredCount} answered</span>
                <span className="text-gray-400">•</span>
                <span className="text-yellow-400">{flaggedQuestions.size} flagged</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{unansweredCount} remaining</span>
              </div>
            </div>
            
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="glass-effect rounded-2xl p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-white">
                    Question {currentQuestion + 1} of {quizData.total_questions}
                  </span>
                  {currentQ.topic_name && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                      {currentQ.topic_name}
                    </span>
                  )}
                  {currentQ.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      currentQ.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      currentQ.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => toggleFlag(currentQuestion)}
                  className={`p-2 rounded-lg transition ${
                    flaggedQuestions.has(currentQuestion)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-xl text-white leading-relaxed">
                  {currentQ.question_text}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQ.question_id, index)}
                    className={`w-full p-4 rounded-xl text-left transition ${
                      answers[currentQ.question_id] === index
                        ? 'bg-purple-500/30 border-2 border-purple-500 text-white'
                        : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQ.question_id] === index
                          ? 'bg-purple-500 border-purple-500 text-white'
                          : 'border-gray-400'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    currentQuestion === 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(quizData.total_questions - 1, prev + 1))}
                  disabled={currentQuestion === quizData.total_questions - 1}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    currentQuestion === quizData.total_questions - 1
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="space-y-4">
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
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition flex items-center justify-center"
            >
              <Send className="w-5 h-5 mr-2" />
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-effect rounded-2xl p-6 max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Submission</h3>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-300">Are you sure you want to submit your quiz?</p>
              
              <div className="bg-white/10 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Answered Questions:</span>
                  <span className="text-white">{answeredCount} / {quizData.total_questions}</span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400">Unanswered Questions:</span>
                    <span className="text-yellow-400">{unansweredCount}</span>
                  </div>
                )}
                {flaggedQuestions.size > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-400">Flagged Questions:</span>
                    <span className="text-orange-400">{flaggedQuestions.size}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Review Again
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition"
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