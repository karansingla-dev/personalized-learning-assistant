// frontend/src/app/dashboard/quiz/results/page.tsx
// FIXED VERSION - Proper data loading and no premature redirects

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy,
  XCircle,
  CheckCircle,
  AlertCircle,
  Target,
  Clock,
  Brain,
  TrendingUp,
  Award,
  Sparkles,
  Home,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface QuestionResult {
  question_id: string;
  question_text: string;
  options: string[];
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

interface QuizResult {
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  passed_topics: string[];
  time_taken_minutes: number;
  question_results: QuestionResult[];
  message: string;
}

export default function QuizResultsPage() {
  const router = useRouter();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add a small delay to ensure data is properly stored
    const loadResults = async () => {
      try {
        // Wait a moment for data to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if result is ready
        const resultReady = sessionStorage.getItem('quizResultReady');
        const storedResult = sessionStorage.getItem('quizResult');
        
        if (!storedResult) {
          setError('No quiz results found. Please take a quiz first.');
          setLoading(false);
          return;
        }
        
        const result = JSON.parse(storedResult);
        setQuizResult(result);
        
        // Clear the ready flag but keep the result for page refreshes
        sessionStorage.removeItem('quizResultReady');
        
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };
    
    loadResults();
  }, []);

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const expandAllWrong = () => {
    if (!quizResult) return;
    
    const wrongQuestions = quizResult.question_results
      .filter(q => !q.is_correct)
      .map(q => q.question_id);
    
    setExpandedQuestions(new Set(wrongQuestions));
    setShowOnlyWrong(true);
  };

  const resetFilters = () => {
    setExpandedQuestions(new Set());
    setShowOnlyWrong(false);
  };

  const handleRetakeQuiz = () => {
    // Clear results and go back to quiz selection
    sessionStorage.removeItem('quizResult');
    sessionStorage.removeItem('quizData');
    router.push('/dashboard/quiz');
  };

  const handleBackToDashboard = () => {
    // Clear quiz data and go to dashboard
    sessionStorage.removeItem('quizResult');
    sessionStorage.removeItem('quizData');
    router.push('/dashboard');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quizResult) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
          <p className="text-white/60 mb-6">
            {error || 'Quiz results not available. Please take a quiz first.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/quiz')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
          >
            Take a Quiz
          </button>
        </div>
      </div>
    );
  }

  const scorePercentage = Math.round(quizResult.score);
  const isPassed = quizResult.passed;
  
  const questionsToShow = showOnlyWrong 
    ? quizResult.question_results.filter(q => !q.is_correct)
    : quizResult.question_results;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBackToDashboard}
          className="flex items-center text-white/70 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Score Card */}
        <div className="glass-effect rounded-2xl p-8 mb-8">
          <div className="text-center">
            {/* Result Icon */}
            <div className="mb-6">
              {isPassed ? (
                <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-green-400" />
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Target className="w-12 h-12 text-yellow-400" />
                </div>
              )}
            </div>

            {/* Score Display */}
            <h1 className="text-4xl font-bold text-white mb-2">
              {scorePercentage}%
            </h1>
            
            <p className={`text-xl mb-4 ${isPassed ? 'text-green-400' : 'text-yellow-400'}`}>
              {quizResult.message}
            </p>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{quizResult.correct_count}</span>
                </div>
                <p className="text-white/60 text-sm">Correct</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-2xl font-bold text-white">
                    {quizResult.total_questions - quizResult.correct_count}
                  </span>
                </div>
                <p className="text-white/60 text-sm">Incorrect</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{quizResult.time_taken_minutes}</span>
                </div>
                <p className="text-white/60 text-sm">Minutes</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleRetakeQuiz}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Take Another Quiz
              </button>
              <button
                onClick={handleBackToDashboard}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <BookOpen className="w-6 h-6 mr-2" />
              Review Answers
            </h2>
            
            <div className="flex gap-2">
              {quizResult.total_questions - quizResult.correct_count > 0 && (
                <button
                  onClick={expandAllWrong}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm"
                >
                  Show Wrong Answers
                </button>
              )}
              {(showOnlyWrong || expandedQuestions.size > 0) && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questionsToShow.map((question, index) => (
              <div
                key={question.question_id}
                className={`border rounded-lg p-4 transition-all ${
                  question.is_correct 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestionExpansion(question.question_id)}
                  className="w-full flex justify-between items-start text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {question.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mr-2" />
                      )}
                      <span className="text-white/60 text-sm">
                        Question {showOnlyWrong ? question.question_id.split('_')[1] : index + 1}
                      </span>
                    </div>
                    <p className="text-white font-medium">{question.question_text}</p>
                  </div>
                  
                  {expandedQuestions.has(question.question_id) ? (
                    <ChevronUp className="w-5 h-5 text-white/60 ml-4" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/60 ml-4" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedQuestions.has(question.question_id) && (
                  <div className="mt-4 space-y-3">
                    {/* Options */}
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = question.user_answer === optIndex;
                        const isCorrectAnswer = question.correct_answer === optIndex;
                        
                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg border ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-500/10'
                                : isUserAnswer && !isCorrectAnswer
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="font-bold mr-2 text-white/60">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className={
                                isCorrectAnswer 
                                  ? 'text-green-400' 
                                  : isUserAnswer && !isCorrectAnswer
                                  ? 'text-red-400'
                                  : 'text-white/80'
                              }>
                                {option}
                              </span>
                              {isCorrectAnswer && (
                                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start">
                        <Lightbulb className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-blue-400 font-semibold mb-1">Explanation:</p>
                          <p className="text-white/80 text-sm">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}