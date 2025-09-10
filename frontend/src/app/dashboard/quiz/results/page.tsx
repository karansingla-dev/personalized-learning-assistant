// frontend/src/app/dashboard/quiz/results/page.tsx
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
  Lightbulb
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

  useEffect(() => {
    // Load quiz result from session storage
    const storedResult = sessionStorage.getItem('quizResult');
    if (!storedResult) {
      router.push('/dashboard/quiz');
      return;
    }
    
    const result = JSON.parse(storedResult);
    setQuizResult(result);
    
    // Clear session storage
    sessionStorage.removeItem('quizResult');
    sessionStorage.removeItem('quizData');
  }, [router]);

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

  if (!quizResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white/60">Loading results...</p>
        </div>
      </div>
    );
  }

  const scorePercentage = Math.round(quizResult.score);
  const wrongCount = quizResult.total_questions - quizResult.correct_count;
  
  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-400';
    if (scorePercentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = () => {
    if (scorePercentage >= 80) return 'from-green-500 to-emerald-500';
    if (scorePercentage >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const questionsToShow = showOnlyWrong 
    ? quizResult.question_results.filter(q => !q.is_correct)
    : quizResult.question_results;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {quizResult.passed ? (
            <>
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h1 className="text-4xl font-bold text-white mb-2">Congratulations! 🎉</h1>
              <p className="text-xl text-green-400">You passed the quiz!</p>
            </>
          ) : (
            <>
              <Target className="w-20 h-20 text-orange-400 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white mb-2">Keep Practicing!</h1>
              <p className="text-xl text-yellow-400">You need 80% to pass</p>
            </>
          )}
        </div>

        {/* Score Card */}
        <div className="glass-effect rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - scorePercentage / 100)}`}
                    className={getScoreColor()}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor()}`}>
                    {scorePercentage}%
                  </span>
                  <span className="text-sm text-gray-400">Score</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Correct Answers</span>
                <span className="text-green-400 font-bold text-xl">
                  {quizResult.correct_count} / {quizResult.total_questions}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Wrong Answers</span>
                <span className="text-red-400 font-bold text-xl">
                  {wrongCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Time Taken</span>
                <span className="text-blue-400 font-bold text-xl">
                  {quizResult.time_taken_minutes} min
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold text-xl ${quizResult.passed ? 'text-green-400' : 'text-yellow-400'}`}>
                  {quizResult.passed ? 'PASSED' : 'NOT PASSED'}
                </span>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-400" />
                Achievements
              </h3>
              
              {quizResult.passed_topics.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Topics Completed:</p>
                  <div className="flex flex-wrap gap-2">
                    {quizResult.passed_topics.map((topic, index) => (
                      <span key={index} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        ✓ Topic {index + 1}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Score 80% or higher to complete topics
                </p>
              )}
              
              {scorePercentage === 100 && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold">Perfect Score!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
          
          <button
            onClick={() => router.push('/dashboard/quiz')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Take Another Quiz
          </button>
          
          {wrongCount > 0 && (
            <button
              onClick={expandAllWrong}
              className="px-6 py-3 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition flex items-center"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Review Wrong Answers ({wrongCount})
            </button>
          )}
        </div>

        {/* Question Review */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-400" />
              Question Review
            </h2>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWrong}
                onChange={(e) => setShowOnlyWrong(e.target.checked)}
                className="rounded text-purple-500"
              />
              <span className="text-sm text-gray-400">Show only wrong answers</span>
            </label>
          </div>

          <div className="space-y-4">
            {questionsToShow.map((question, index) => (
              <div
                key={question.question_id}
                className={`rounded-xl border-2 overflow-hidden transition ${
                  question.is_correct 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestionExpansion(question.question_id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center space-x-3">
                    {question.is_correct ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <span className="text-white font-semibold">
                      Question {index + 1}
                    </span>
                    {!question.is_correct && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        Review This
                      </span>
                    )}
                  </div>
                  
                  {expandedQuestions.has(question.question_id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Question Details */}
                {expandedQuestions.has(question.question_id) && (
                  <div className="p-4 border-t border-white/10">
                    <p className="text-white mb-4">{question.question_text}</p>
                    
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = question.user_answer === optIndex;
                        const isCorrectAnswer = question.correct_answer === optIndex;
                        
                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg flex items-center space-x-3 ${
                              isCorrectAnswer
                                ? 'bg-green-500/20 border border-green-500'
                                : isUserAnswer && !isCorrectAnswer
                                ? 'bg-red-500/20 border border-red-500'
                                : 'bg-white/5'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              isCorrectAnswer
                                ? 'bg-green-500 text-white'
                                : isUserAnswer && !isCorrectAnswer
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-gray-400'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            <span className={`${
                              isCorrectAnswer
                                ? 'text-green-400'
                                : isUserAnswer && !isCorrectAnswer
                                ? 'text-red-400'
                                : 'text-gray-400'
                            }`}>
                              {option}
                            </span>
                            {isCorrectAnswer && (
                              <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <XCircle className="w-5 h-5 text-red-400 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-400 font-semibold mb-1">Explanation:</p>
                          <p className="text-gray-300 text-sm">{question.explanation}</p>
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