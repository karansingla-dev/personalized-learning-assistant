// frontend/src/app/topics/[topicId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  url?: string;
  duration: string;
  views: string;
  quality_score: number;
  language: string;
  description?: string;
  likes?: string;
}

interface Article {
  id: string;
  title: string;
  source: string;
  type: string;
  icon: string;
  url: string;
  reading_time: string;
  difficulty: string;
  highlights: string[];
}

interface AISummary {
  overview: string;
  key_concepts: string[];
  formulas?: string[];
  learning_approach?: string;
  common_mistakes: string[];
  memory_tips: string;
  applications: string[];
  exam_tips?: string[];
}

interface TopicContent {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  class_level: number;
  chapter_number: number;
  videos: Video[];
  articles: Article[];
  ai_summary: AISummary;
  practice_resources: any;
}

export default function TopicLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const topicId = params.topicId as string;
  const [content, setContent] = useState<TopicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'articles' | 'summary'>('summary');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (topicId && userId) {
      fetchTopicContent();
    }
  }, [topicId, userId]);

  const fetchTopicContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching content for topic:', topicId);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/topics/${topicId}/content?user_id=${userId}`
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Content received:', data);
      
      setContent(data);
      
      // Set first video as selected if available
      if (data.videos && data.videos.length > 0) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
      showToast.error('Failed to load topic content');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTopics = async () => {
    if (!userId || !topicId) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/topics/${topicId}/complete?user_id=${userId}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        showToast.success('Topic marked as complete!');
        router.push('/dashboard');
      }
    } catch (error) {
      showToast.error('Failed to mark as complete');
    }
  };

  const handleStartQuiz = () => {
    router.push(`/quiz/${topicId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading learning content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Content</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTopicContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Content Available</h2>
          <p className="text-gray-600 mb-4">This topic doesn't have any content yet.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <p className="text-sm text-gray-500">
                  {content.subject_name} • Chapter {content.chapter_number}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">{content.topic_name}</h1>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStartQuiz}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Take Quiz 📝
              </button>
              <button
                onClick={handleCompleteTopics}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Mark Complete ✓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📚 AI Summary
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'videos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🎥 Videos ({content.videos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'articles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 Articles ({content.articles?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Summary Tab */}
        {activeTab === 'summary' && content.ai_summary && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-3">📖</span> What Will You Learn?
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {content.ai_summary.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Concepts */}
                {content.ai_summary.key_concepts && content.ai_summary.key_concepts.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🎯</span> Key Concepts Explained Simply
                    </h3>
                    <div className="space-y-4">
                      {content.ai_summary.key_concepts.map((concept, idx) => (
                        <div key={idx} className="flex items-start bg-blue-50 rounded-lg p-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {idx + 1}
                          </span>
                          <p className="text-gray-700 flex-1">{concept}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Approach */}
                {content.ai_summary.learning_approach && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📚</span> How to Study This Topic
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {content.ai_summary.learning_approach}
                    </p>
                  </div>
                )}

                {/* Common Mistakes */}
                {content.ai_summary.common_mistakes && content.ai_summary.common_mistakes.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⚠️</span> Avoid These Common Mistakes
                    </h3>
                    <div className="space-y-3">
                      {content.ai_summary.common_mistakes.map((mistake, idx) => (
                        <div key={idx} className="flex items-start bg-red-50 rounded-lg p-3">
                          <span className="text-red-500 text-xl mr-3">⚡</span>
                          <p className="text-gray-700">{mistake}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Right Side */}
              <div className="space-y-6">
                {/* Memory Tips */}
                {content.ai_summary.memory_tips && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">💡</span> Memory Tricks
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {content.ai_summary.memory_tips}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleStartQuiz}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
                    >
                      Test Your Knowledge 🎯
                    </button>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Watch Video Lessons 📺
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && content.videos && content.videos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {selectedVideo && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {/* YouTube Embed */}
                  <div className="relative pb-[56.25%] mb-4">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=0&rel=0&modestbranding=1`}
                      title={selectedVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedVideo.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-gray-600">{selectedVideo.channel}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>⏱ {selectedVideo.duration}</span>
                          <span>👁 {selectedVideo.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Top Videos for This Topic
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {content.videos.map((video, index) => (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      selectedVideo?.id === video.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 line-clamp-2">
                          {index + 1}. {video.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {video.channel} • {video.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && content.articles && content.articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.articles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{article.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{article.title}</h3>
                      <p className="text-sm text-gray-600">{article.source} • {article.reading_time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    article.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    article.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {article.difficulty}
                  </span>
                </div>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Read Article →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}