// frontend/src/components/TopicArticles.tsx
/**
 * COMPLETE TOPIC ARTICLES COMPONENT WITH PDF SUPPORT
 * This displays articles and PDFs with Google Docs viewer
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  ExternalLink, 
  BookOpen,
  RefreshCw,
  X,
  ChevronRight,
  Globe,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  Quote,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Download
} from 'lucide-react';

// Type definitions
interface Article {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  source: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  relevance_score: number;
  order: number;
}

interface ArticleContent {
  title: string;
  url: string;
  content_blocks: ContentBlock[];
  reading_time: number;
  success: boolean;
  is_pdf?: boolean;
  pdf_url?: string;
}

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote' | 'image';
  text?: string;
  level?: number;
  ordered?: boolean;
  items?: string[];
  src?: string;
  alt?: string;
}

// Article Card Component
const ArticleCard = ({ article, onRead, index }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'from-green-400 to-emerald-400';
      case 'Medium': return 'from-yellow-400 to-orange-400';
      case 'Advanced': return 'from-red-400 to-pink-400';
      default: return 'from-blue-400 to-cyan-400';
    }
  };

  const getSourceIcon = (source) => {
    if (source.includes('geeksforgeeks')) return '🎯';
    if (source.includes('khanacademy')) return '🎓';
    if (source.includes('wikipedia')) return '📚';
    if (source.includes('byjus')) return '📖';
    if (source.includes('vedantu')) return '✨';
    if (source.includes('.pdf')) return '📄';
    return '📄';
  };

  return (
    <div
      className="glass-effect rounded-xl p-6 hover-lift cursor-pointer transition-all hover:border-white/30 group"
      onClick={() => onRead(article)}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
            {getSourceIcon(article.source)}
          </div>
          <div>
            <span className="text-xs text-gray-400">From {article.source}</span>
            <div className={`inline-block ml-2 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${getDifficultyColor(article.difficulty)} text-white`}>
              {article.difficulty}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500">#{article.order}</span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
        {article.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
        {article.excerpt}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-xs text-gray-500">
            <Eye className="w-3 h-3 mr-1" />
            <span>{article.url.endsWith('.pdf') ? 'Read PDF' : 'Read Article'}</span>
          </div>
          {article.relevance_score > 50 && (
            <div className="flex items-center text-xs text-yellow-400">
              <Award className="w-3 h-3 mr-1" />
              <span>Recommended</span>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-all group-hover:translate-x-1" />
      </div>
    </div>
  );
};

// Article Reader Component with PDF Support
const ArticleReader = ({ articleUrl, onClose }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState('medium');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    fetchArticleContent();
  }, [articleUrl]);

  const fetchArticleContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/articles/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            article_url: articleUrl
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch article');
      
      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContentBlock = (block, index) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level}`;
        const headingClasses = {
          2: 'text-2xl font-bold text-white mt-6 mb-3',
          3: 'text-xl font-semibold text-white mt-5 mb-2',
          4: 'text-lg font-medium text-white mt-4 mb-2'
        };
        return (
          <HeadingTag key={index} className={headingClasses[block.level] || 'text-lg font-medium text-white'}>
            {block.text}
          </HeadingTag>
        );
      
      case 'paragraph':
        return (
          <p key={index} className={`text-gray-300 mb-4 leading-relaxed ${
            fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
          }`}>
            {block.text}
          </p>
        );
      
      case 'list':
        return (
          <div key={index} className="mb-4">
            {block.ordered ? (
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                {block.items?.map((item, i) => (
                  <li key={i} className={fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}>
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                {block.items?.map((item, i) => (
                  <li key={i} className={fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'code':
        return (
          <pre key={index} className="bg-black/40 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-green-400 text-sm font-mono">{block.text}</code>
          </pre>
        );
      
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-purple-500 pl-4 py-2 mb-4 italic text-gray-400">
            <Quote className="w-4 h-4 inline mr-2 text-purple-400" />
            {block.text}
          </blockquote>
        );
      
      case 'image':
        return (
          <div key={index} className="mb-4">
            <img 
              src={block.src} 
              alt={block.alt || 'Article image'} 
              className="max-w-full h-auto rounded-lg"
              onError={(e) => e.target.style.display = 'none'}
            />
            {block.alt && (
              <p className="text-xs text-gray-500 mt-2 text-center">{block.alt}</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading article...</p>
        </div>
      </div>
    );
  }

  // Check if it's a PDF
  const isPDF = content?.is_pdf || articleUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className={`fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm ${fullscreen ? '' : 'p-4 pt-18'} overflow-hidden`}>
      <div className={`${fullscreen ? 'h-full' : 'max-w-6xl mx-auto h-full'} bg-gradient-to-br from-gray-900 via-purple-900/50 to-violet-900/30 ${fullscreen ? '' : 'rounded-2xl'} flex flex-col`}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                {isPDF && <FileText className="w-5 h-5 mr-2 text-purple-400" />}
                {content?.title || 'Document'}
              </h2>
              {!isPDF && content?.reading_time > 0 && (
                <span className="text-sm text-gray-400 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {content.reading_time} min read
                </span>
              )}
              {isPDF && (
                <span className="text-sm text-purple-400 flex items-center mt-1">
                  <FileText className="w-3 h-3 mr-1" />
                  PDF Document
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Font Size Controls - Only for non-PDF */}
            {!isPDF && (
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-2 py-1 rounded ${fontSize === 'small' ? 'bg-white/20' : ''}`}
                >
                  <span className="text-xs text-white">A</span>
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-2 py-1 rounded ${fontSize === 'medium' ? 'bg-white/20' : ''}`}
                >
                  <span className="text-sm text-white">A</span>
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-1 rounded ${fontSize === 'large' ? 'bg-white/20' : ''}`}
                >
                  <span className="text-base text-white">A</span>
                </button>
              </div>
            )}
            
            <button
              onClick={copyLink}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
            
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              {fullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
            </button>
            
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </a>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isPDF ? (
            // PDF Viewer with Google Docs Viewer
            <div className="w-full h-full bg-gray-900 relative">
              {/* Google Docs Viewer for PDFs */}
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(articleUrl)}&embedded=true`}
                className="w-full h-full"
                title={content?.title || 'PDF Document'}
              />
              
              {/* Fallback buttons if PDF doesn't load */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-center space-x-4">
                  <a
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(articleUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Open in Google Viewer
                  </a>
                  <a
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </div>
                <p className="text-center text-gray-400 text-sm mt-2">
                  If the PDF doesn't display above, use the buttons to view or download
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white mb-4">Failed to load article content</p>
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Open Original Article
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          ) : content?.success === false ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-white mb-4">Unable to extract article content</p>
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Read on Original Website
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          ) : (
            <div className="overflow-y-auto h-full p-6 custom-scrollbar">
              <div className="max-w-3xl mx-auto">
                {content?.content_blocks?.map((block, index) => renderContentBlock(block, index))}
                
                {content?.content_blocks?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No content available</p>
                    <a
                      href={articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      View Original Article
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main TopicArticles Component
export default function TopicArticles({ topicId, topicName }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchArticles();
    fetchStats();
  }, [topicId]);

  const fetchArticles = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/articles/topic/${topicId}?force_refresh=${forceRefresh}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch articles');
      
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/articles/stats/${topicId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchArticles(true);
  };

  const handleReadArticle = (article) => {
    setSelectedArticle(article);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Finding best articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white mb-4">Failed to load articles</p>
        <button
          onClick={() => fetchArticles()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            📚 Educational Articles
          </h2>
          <p className="text-gray-400">
            Curated reading materials for {topicName}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-white">Refresh</span>
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.total_articles}</div>
            <div className="text-xs text-gray-400">Articles Found</div>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Object.keys(stats.sources || {}).length}
            </div>
            <div className="text-xs text-gray-400">Sources</div>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {stats.difficulties?.Easy || 0}
            </div>
            <div className="text-xs text-gray-400">Easy Articles</div>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRead={handleReadArticle}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-effect rounded-xl">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No articles found for this topic</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Search Again
          </button>
        </div>
      )}

      {/* Article Reader Modal */}
      {selectedArticle && (
        <ArticleReader
          articleUrl={selectedArticle.url}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .glass-effect {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
        }
      `}</style>
    </>
  );
}