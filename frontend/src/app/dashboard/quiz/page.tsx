// frontend/src/app/dashboard/quiz/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  Trophy,
  Book,
  Clock,
  ChevronRight,
  Check,
  AlertCircle,
  Sparkles,
  Target,
  Brain,
  Zap,
  ArrowLeft,
  Play,
  BookOpen,
  Timer,
  CheckSquare,
  Square
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  icon: string;
  total_topics: number;
  color: string;
}

interface Topic {
  _id: string;
  name: string;
  chapter_number: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  is_completed: boolean;
}

export default function QuizSelectionPage() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [step, setStep] = useState<'subject' | 'topics'>('subject');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, [userId]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/dashboard/subjects?user_id=${userId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch subjects');
      
      const data = await response.json();
      
      // Map subjects with colors
      const subjectsWithColors = data.map((subject: any) => ({
        ...subject,
        color: getSubjectColor(subject.name)
      }));
      
      setSubjects(subjectsWithColors);
    } catch (err) {
      setError('Failed to load subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subjects/${subjectId}/topics?user_id=${userId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch topics');
      
      const data = await response.json();
      setTopics(data);
      setStep('topics');
    } catch (err) {
      setError('Failed to load topics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (name: string) => {
    const colors: { [key: string]: string } = {
      'Physics': 'from-blue-500 to-cyan-500',
      'Mathematics': 'from-purple-500 to-pink-500',
      'Chemistry': 'from-green-500 to-emerald-500',
      'Biology': 'from-orange-500 to-red-500',
      'Computer Science': 'from-indigo-500 to-blue-500',
      'English': 'from-pink-500 to-rose-500',
      'History': 'from-amber-500 to-yellow-500',
      'Geography': 'from-teal-500 to-green-500',
    };
    return colors[name] || 'from-gray-500 to-gray-600';
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    fetchTopics(subject.id);
  };

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      }
      return [...prev, topicId];
    });
  };

  const handleStartQuiz = () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    // Navigate to quiz taking page with selected data
    const quizData = {
      subject_id: selectedSubject?.id,
      subject_name: selectedSubject?.name,
      topic_ids: selectedTopics,
      topics: topics.filter(t => selectedTopics.includes(t._id))
    };

    // Store in sessionStorage for the quiz page
    sessionStorage.setItem('quizData', JSON.stringify(quizData));
    router.push('/dashboard/quiz/start');
  };

  const calculateQuizInfo = () => {
    const numTopics = selectedTopics.length;
    const totalQuestions = numTopics * 15;
    const totalTime = Math.min(numTopics * 20, 60); // Max 60 minutes
    
    return {
      questions: totalQuestions,
      time: totalTime,
      passingScore: Math.ceil(totalQuestions * 0.8)
    };
  };

  const quizInfo = calculateQuizInfo();

  if (loading && subjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (step === 'topics') {
                setStep('subject');
                setSelectedTopics([]);
              } else {
                router.push('/dashboard');
              }
            }}
            className="flex items-center text-white/70 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Trophy className="w-8 h-8 mr-3 text-yellow-400" />
            Practice Quiz
          </h1>
          <p className="text-white/60 mt-2">
            {step === 'subject' 
              ? 'Select a subject to start your quiz'
              : `Select topics from ${selectedSubject?.name} (Multiple selection allowed)`}
          </p>
        </div>

        {/* Subject Selection */}
        {step === 'subject' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject)}
                className="glass-effect rounded-2xl p-6 hover-lift text-left group"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center mb-4`}>
                  <span className="text-3xl">{subject.icon}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {subject.name}
                </h3>
                
                <p className="text-white/60 text-sm mb-4">
                  {subject.total_topics} topics available
                </p>
                
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition">
                  <span className="text-sm">Start Quiz</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Topic Selection */}
        {step === 'topics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topics List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-effect rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-blue-400" />
                  Select Topics
                </h2>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {topics.map((topic) => (
                    <div
                      key={topic._id}
                      onClick={() => toggleTopicSelection(topic._id)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        selectedTopics.includes(topic._id)
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {selectedTopics.includes(topic._id) ? (
                            <CheckSquare className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white">
                              Chapter {topic.chapter_number}: {topic.name}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              topic.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                              topic.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {topic.difficulty}
                            </span>
                          </div>
                          
                          {topic.is_completed && (
                            <div className="flex items-center text-xs text-green-400 mt-1">
                              <Check className="w-3 h-3 mr-1" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quiz Info Panel */}
            <div className="space-y-4">
              {/* Selected Topics Summary */}
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Quiz Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Selected Topics</span>
                      <span className="text-white font-bold">{selectedTopics.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Questions</span>
                      <span className="text-white font-bold">{quizInfo.questions}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Time Limit</span>
                      <span className="text-white font-bold">{quizInfo.time} minutes</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Passing Score</span>
                      <span className="text-green-400 font-bold">80% ({quizInfo.passingScore}/{quizInfo.questions})</span>
                    </div>
                  </div>
                  
                  {selectedTopics.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-3">Selected Topics:</p>
                      <div className="space-y-1">
                        {topics
                          .filter(t => selectedTopics.includes(t._id))
                          .map(t => (
                            <div key={t._id} className="text-xs text-white/80">
                              • {t.name}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Quiz Button */}
              <button
                onClick={handleStartQuiz}
                disabled={selectedTopics.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-white transition transform hover:scale-105 flex items-center justify-center ${
                  selectedTopics.length > 0
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Quiz
              </button>

              {/* Info */}
              <div className="glass-effect rounded-2xl p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    <p className="mb-2">• 15 questions per topic</p>
                    <p className="mb-2">• 20 minutes per topic (max 60 min)</p>
                    <p className="mb-2">• 80% score required to pass</p>
                    <p>• Topics marked complete after passing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}