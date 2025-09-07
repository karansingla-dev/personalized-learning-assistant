// frontend/src/app/dashboard/topics/[topicId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import BlogReader from '@/components/BlogReader';
import { BookOpen, Play, FileText, Brain, X, ExternalLink, Clock } from 'lucide-react';

// Type definitions
interface Video {
  id: string;
  video_id?: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  channel?: string;
  author?: string;
  duration_minutes?: number;
}

interface Article {
  id: string;
  title: string;
  source: string;
  type: string;
  icon: string;
  url: string;
  content?: string;
  snippet?: string;
  reading_time?: string;
  has_content?: boolean;
}

interface TopicContent {
  topic_id: string;
  topic_name: string;
  topic_description?: string;
  ai_explanation?: string;
  ai_summary?: string;
  videos: Video[];
  articles: Article[];
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const topicId = params.topicId as string;
  
  const [content, setContent] = useState<TopicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'videos' | 'articles'>('summary');
  const [showBlogReader, setShowBlogReader] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    if (topicId && userId) {
      fetchContent();
    }
  }, [topicId, userId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/topics/${topicId}/content?user_id=${userId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      console.log('Content received:', data);
      setContent(data);
      
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Render AI Summary with proper formatting
  const renderAISummary = () => {
    if (!content?.ai_explanation && !content?.ai_summary) {
      return <p className="text-gray-500">No AI summary available</p>;
    }
    
    const summary = content.ai_explanation || content.ai_summary || '';
    
    // Convert markdown-style headers to HTML
    const formattedSummary = summary
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mt-6 mb-3">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mt-4 mb-2 text-blue-600">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium mt-3 mb-2">{line.substring(4)}</h3>;
        }
        
        // Bold text
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={index} className="mb-2">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </p>
          );
        }
        
        // List items
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <li key={index} className="ml-6 mb-1 list-disc">
              {line.substring(2)}
            </li>
          );
        }
        
        // Numbered items
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={index} className="ml-6 mb-1 list-decimal">
              {line.substring(line.indexOf('.') + 2)}
            </li>
          );
        }
        
        // Regular paragraphs
        if (line.trim()) {
          return <p key={index} className="mb-2 text-gray-700">{line}</p>;
        }
        
        return null;
      });
    
    return <div className="prose prose-lg max-w-none">{formattedSummary}</div>;
  };

  // Render Videos with working players
  const renderVideos = () => {
    if (!content?.videos || content.videos.length === 0) {
      return <p className="text-gray-500">No videos available</p>;
    }
    
    const selectedVideo = content.videos[selectedVideoIndex];
    
    return (
      <div className="space-y-6">
        {/* Video Player */}
        {selectedVideo?.video_id && selectedVideo.video_id !== `demo_${selectedVideoIndex + 1}` ? (
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.video_id}`}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
            <div className="text-center">
              <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Video player placeholder</p>
              <a
                href={selectedVideo?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center justify-center"
              >
                Watch on YouTube <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        )}
        
        {/* Video Title and Info */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">{selectedVideo?.title}</h3>
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            {selectedVideo?.channel && <span>Channel: {selectedVideo.channel}</span>}
            {selectedVideo?.duration_minutes && <span>{selectedVideo.duration_minutes} min</span>}
          </div>
        </div>
        
        {/* Video List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.videos.map((video, index) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideoIndex(index)}
              className={`bg-white rounded-lg p-4 cursor-pointer transition hover:shadow-lg ${
                index === selectedVideoIndex ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Thumbnail */}
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded mb-3"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/480x360.png?text=Video';
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Title */}
              <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
              
              {/* Channel */}
              <p className="text-xs text-gray-600">{video.channel || video.author || 'Educational Video'}</p>
              
              {/* Duration */}
              {video.duration_minutes && (
                <p className="text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {video.duration_minutes} min
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Articles/Blogs
  const renderArticles = () => {
    if (!content?.articles || content.articles.length === 0) {
      return <p className="text-gray-500">No articles available</p>;
    }
    
    const blogsWithContent = content.articles.filter(a => a.has_content && a.content);
    
    return (
      <div className="space-y-6">
        {/* Header with Read All button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Educational Articles & Blogs ({content.articles.length})
          </h2>
          
          {blogsWithContent.length > 0 && (
            <button
              onClick={() => setShowBlogReader(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition flex items-center"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Read All {blogsWithContent.length} Blogs
            </button>
          )}
        </div>
        
        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg p-5 shadow-sm hover:shadow-lg transition cursor-pointer"
              onClick={() => {
                if (article.has_content && article.content) {
                  setShowBlogReader(true);
                } else if (article.url && article.url !== '#') {
                  window.open(article.url, '_blank');
                }
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{article.icon || '📄'}</span>
                    <span className="text-xs text-gray-500 uppercase">{article.type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </div>
              
              {/* Snippet */}
              {article.snippet && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {article.snippet}
                </p>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {article.source} • {article.reading_time || '5 min'}
                </span>
                <span className="text-blue-600 flex items-center">
                  {article.has_content ? (
                    <>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Read Here
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Visit Site
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No content available</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold">{content.topic_name}</h1>
                {content.topic_description && (
                  <p className="text-gray-600">{content.topic_description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium transition ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              AI Summary
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`py-4 px-1 border-b-2 font-medium transition ${
                activeTab === 'videos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Play className="w-4 h-4 inline mr-2" />
              Videos ({content.videos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-4 px-1 border-b-2 font-medium transition ${
                activeTab === 'articles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Articles ({content.articles?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'summary' && renderAISummary()}
          {activeTab === 'videos' && renderVideos()}
          {activeTab === 'articles' && renderArticles()}
        </div>
      </div>

      {/* Blog Reader Modal */}
      {showBlogReader && content.articles && (
        <BlogReader
          blogs={content.articles.filter(a => a.has_content && a.content)}
          topicName={content.topic_name}
          onClose={() => setShowBlogReader(false)}
        />
      )}
    </div>
  );
}