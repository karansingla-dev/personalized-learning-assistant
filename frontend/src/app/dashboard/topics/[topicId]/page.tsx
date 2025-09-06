// frontend/src/app/dashboard/topics/[topicId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import { contentService, progressService } from '@/lib/api';

interface LearningResource {
  title: string;
  description: string;
  url: string;
  thumbnail_url?: string;
  author?: string;
  source: string;
  content_type: 'video' | 'article';
  relevance_score?: number;
  duration_minutes?: number;
  reading_time_minutes?: number;
}

interface TopicContent {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  explanation: string;
  simplified_explanation?: string;
  key_concepts: string[];
  learning_objectives: string[];
  prerequisites?: string[];
  next_topics?: string[];
  videos: LearningResource[];
  articles: LearningResource[];
  best_video?: LearningResource;
  best_article?: LearningResource;
  is_completed?: boolean;
  completion_percentage?: number;
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const topicId = params.topicId as string;
  
  const [topicContent, setTopicContent] = useState<TopicContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'articles'>('overview');
  const [isSimplified, setIsSimplified] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (topicId) {
      fetchTopicContent();
    }
  }, [topicId]);

const fetchTopicContent = async () => {
  try {
    setIsLoading(true);
    // FIX: Use service method
    const data = await contentService.getTopicContent(topicId);
    setTopicContent(data);
    setIsCompleted(data.is_completed || false);
  } catch (error) {
    console.error('Error fetching topic content:', error);
    showToast.error('Failed to load topic content');
  } finally {
    setIsLoading(false);
  }
};

const markAsComplete = async () => {
  if (!userId) return;
  
  try {
    // FIX: Use service method
    await progressService.completeTopic(userId, topicId);
    setIsCompleted(true);
    showToast.success('Topic marked as complete! 🎉');
  } catch (error) {
    console.error('Error marking topic as complete:', error);
    showToast.error('Failed to mark topic as complete');
  }
};

  const openResource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!topicContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content not found</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            Go back
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{topicContent.topic_name}</h1>
                <p className="text-sm text-gray-600 mt-1">{topicContent.topic_description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isCompleted ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Completed
                </span>
              ) : (
                <button
                  onClick={markAsComplete}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {(['overview', 'videos', 'articles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && '📚'} {tab === 'videos' && '🎥'} {tab === 'articles' && '📄'} {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Explanation Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Explanation</h2>
                <button
                  onClick={() => setIsSimplified(!isSimplified)}
                  className={`px-4 py-2 rounded-lg transition ${
                    isSimplified
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isSimplified ? '👶 Simple Mode' : '🎓 Standard Mode'}
                </button>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {isSimplified 
                    ? topicContent.simplified_explanation || topicContent.explanation
                    : topicContent.explanation
                  }
                </p>
              </div>
            </div>

            {/* Key Concepts */}
            {topicContent.key_concepts && topicContent.key_concepts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🔑 Key Concepts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topicContent.key_concepts.map((concept, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{concept}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            {topicContent.learning_objectives && topicContent.learning_objectives.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Learning Objectives</h2>
                <ul className="space-y-2">
                  {topicContent.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Best Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Video */}
              {topicContent.best_video && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Best Video</h3>
                  <div className="space-y-3">
                    {topicContent.best_video.thumbnail_url && (
                      <img
                        src={topicContent.best_video.thumbnail_url}
                        alt={topicContent.best_video.title}
                        className="w-full rounded-lg"
                      />
                    )}
                    <h4 className="font-medium text-gray-900">{topicContent.best_video.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {topicContent.best_video.description}
                    </p>
                    <button
                      onClick={() => openResource(topicContent.best_video!.url)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Watch on YouTube →
                    </button>
                  </div>
                </div>
              )}

              {/* Best Article */}
              {topicContent.best_article && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Best Article</h3>
                  <div className="space-y-3">
                    <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">{topicContent.best_article.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {topicContent.best_article.description}
                    </p>
                    {topicContent.best_article.reading_time_minutes && (
                      <p className="text-xs text-gray-500">
                        📖 {topicContent.best_article.reading_time_minutes} min read
                      </p>
                    )}
                    <button
                      onClick={() => openResource(topicContent.best_article!.url)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Read Article →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                📹 Video Resources ({topicContent.videos.length})
              </h2>
              
              {topicContent.videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topicContent.videos.map((video, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition">
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {video.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{video.author}</span>
                          {video.duration_minutes && (
                            <span>{video.duration_minutes} min</span>
                          )}
                        </div>
                        <button
                          onClick={() => openResource(video.url)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          Watch Video
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No video resources available yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                📚 Article Resources ({topicContent.articles.length})
              </h2>
              
              {topicContent.articles.length > 0 ? (
                <div className="space-y-4">
                  {topicContent.articles.map((article, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {article.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              {article.author || article.source}
                            </span>
                            {article.reading_time_minutes && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {article.reading_time_minutes} min read
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => openResource(article.url)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Read →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No article resources available yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}