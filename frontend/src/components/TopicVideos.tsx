// frontend/src/components/TopicVideos.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ExternalLink,
  RefreshCw,
  X,
  Maximize2,
  Volume2,
  BookOpen,
  PlayCircle,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  StickyNote,
  Hash,
  List,
  FileText,
  Copy,
  Check,
  Minimize2,
  Pin,
  PinOff
} from 'lucide-react';

interface Video {
  id: string;
  video_id: string;
  title: string;
  description: string;
  url: string;
  embed_url: string;
  thumbnail_url: string;
  channel: string;
  channel_id: string;
  channel_url: string;
  author: string;
  duration_minutes: number;
  view_count: number;
  like_count: number;
  published_at: string;
  is_educational: boolean;
  relevance_score: number;
}

interface VideoSummary {
  video_id: string;
  video_title: string;
  summary: string;
  key_points: string[];
  topics_covered: string[];
  timestamps: Array<{
    timestamp: string;
    seconds: number;
    text: string;
  }>;
  duration_minutes: number;
  language: string;
  from_cache?: boolean;
}

interface TopicVideosProps {
  topicId: string;
  topicName: string;
  subjectName: string;
  classLevel: number;
}

export default function TopicVideos({ 
  topicId, 
  topicName, 
  subjectName, 
  classLevel 
}: TopicVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Summary states
  const [videoSummary, setVideoSummary] = useState<VideoSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryPinned, setSummaryPinned] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [summaryMinimized, setSummaryMinimized] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [topicId]);

  // Auto-show summary if pinned and video changes
  useEffect(() => {
    if (summaryPinned && selectedVideo) {
      fetchVideoSummary(selectedVideo);
    } else if (!summaryPinned) {
      setVideoSummary(null);
      setShowSummary(false);
    }
  }, [selectedVideo, summaryPinned]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/api/v1/topics/${topicId}/videos?` +
        `topic_name=${encodeURIComponent(topicName)}&` +
        `subject_name=${encodeURIComponent(subjectName)}&` +
        `class_level=${classLevel}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      
      if (data.success === false && data.error === 'YouTube API key not configured') {
        setError('YouTube API key not configured. Please add YOUTUBE_API_KEY to your backend .env file.');
        return;
      }
      
      if (data.success && data.videos && data.videos.length > 0) {
        setVideos(data.videos);
        setSelectedVideo(data.videos[0]);
        setCurrentVideoIndex(0);
      } else if (data.success === false) {
        setError(data.message || 'No videos found for this topic');
      } else {
        setError('No videos found for this topic');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoSummary = async (video: Video) => {
    if (!video) return;
    
    try {
      setSummaryLoading(true);
      setShowSummary(true);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/api/v1/video-summary/${video.video_id}/summarize`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_title: video.title
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVideoSummary(data);
      } else {
        setVideoSummary({
          video_id: video.video_id,
          video_title: video.title,
          summary: data.message || 'Unable to generate summary. The video may not have subtitles available.',
          key_points: [],
          topics_covered: [],
          timestamps: [],
          duration_minutes: video.duration_minutes,
          language: 'Unknown'
        });
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
      setVideoSummary({
        video_id: video.video_id,
        video_title: video.title,
        summary: 'Failed to generate summary. Please try again.',
        key_points: [],
        topics_covered: [],
        timestamps: [],
        duration_minutes: video.duration_minutes,
        language: 'Unknown'
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleVideoSelect = (video: Video, index: number) => {
    setSelectedVideo(video);
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    if (!summaryPinned) {
      setVideoSummary(null);
      setShowSummary(false);
    }
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      const prevVideo = videos[currentVideoIndex - 1];
      setSelectedVideo(prevVideo);
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      const nextVideo = videos[currentVideoIndex + 1];
      setSelectedVideo(nextVideo);
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatViewCount = (count?: number) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          {error.includes('API key') && (
            <div className="text-left bg-gray-800/50 rounded-lg p-4 mb-4">
              <p className="text-white/80 text-sm mb-2">To enable YouTube videos:</p>
              <ol className="text-white/60 text-sm space-y-1 ml-4">
                <li>1. Get a YouTube API key from Google Cloud Console</li>
                <li>2. Add to your backend .env file:</li>
                <li className="bg-black/50 p-2 rounded font-mono text-xs">
                  YOUTUBE_API_KEY=your_key_here
                </li>
                <li>3. Restart your backend server</li>
              </ol>
            </div>
          )}
          <button
            onClick={fetchVideos}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`space-y-6 transition-all duration-300 ${showSummary && !summaryMinimized ? 'pr-0 lg:pr-96' : ''}`}>
        {/* Video Player Section */}
        {selectedVideo && (
          <div className="glass-effect rounded-2xl p-6 space-y-4">
            {/* Video Title and Controls */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {selectedVideo.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedVideo.channel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(selectedVideo.duration_minutes)}
                  </span>
                  {selectedVideo.view_count && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(selectedVideo.view_count)} views
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Summarize Button */}
                <button
                  onClick={() => fetchVideoSummary(selectedVideo)}
                  disabled={summaryLoading}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all flex items-center gap-2 font-medium"
                >
                  {summaryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Summarize
                    </>
                  )}
                </button>
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  YouTube
                </a>
              </div>
            </div>

            {/* YouTube Embed Player */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <iframe
                src={`${selectedVideo.embed_url}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1&controls=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousVideo}
                disabled={currentVideoIndex === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  currentVideoIndex === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <span className="text-white/60">
                Video {currentVideoIndex + 1} of {videos.length}
              </span>
              
              <button
                onClick={handleNextVideo}
                disabled={currentVideoIndex === videos.length - 1}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  currentVideoIndex === videos.length - 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Video List */}
        <div className="glass-effect rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-purple-400" />
            Related Videos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video, index) => (
              <div
                key={video.id}
                onClick={() => handleVideoSelect(video, index)}
                className={`
                  group relative cursor-pointer rounded-xl overflow-hidden bg-gray-800/50 
                  hover:bg-gray-700/50 transition-all hover:scale-[1.02] border
                  ${selectedVideo?.video_id === video.video_id 
                    ? 'border-purple-500 ring-2 ring-purple-500/50' 
                    : 'border-white/10'
                  }
                `}
              >
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-gray-900">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x90/4a5568/9ca3af?text=Video';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                      {formatDuration(video.duration_minutes)}
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {video.channel}
                      {video.is_educational && (
                        <span className="ml-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          Verified
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {video.view_count && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewCount(video.view_count)}
                        </span>
                      )}
                      {video.like_count && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {formatViewCount(video.like_count)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Note Summary Panel */}
      {showSummary && (
        <div className={`
          fixed top-20 right-4 w-80 lg:w-96 
          ${summaryMinimized ? 'h-14' : 'h-[calc(100vh-6rem)]'} 
          transition-all duration-300 z-50
        `}>
          <div className="h-full bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl shadow-2xl border-2 border-yellow-300 overflow-hidden">
            {/* Sticky Note Header */}
            <div className="bg-gradient-to-r from-yellow-300 to-orange-300 p-3 flex items-center justify-between cursor-move">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-orange-700" />
                <h3 className="font-bold text-orange-900">Video Summary</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSummaryPinned(!summaryPinned)}
                  className="p-1.5 hover:bg-orange-400/30 rounded-lg transition-colors"
                  title={summaryPinned ? "Unpin summary" : "Pin summary"}
                >
                  {summaryPinned ? (
                    <Pin className="w-4 h-4 text-orange-700" />
                  ) : (
                    <PinOff className="w-4 h-4 text-orange-700" />
                  )}
                </button>
                <button
                  onClick={() => setSummaryMinimized(!summaryMinimized)}
                  className="p-1.5 hover:bg-orange-400/30 rounded-lg transition-colors"
                >
                  {summaryMinimized ? (
                    <Maximize2 className="w-4 h-4 text-orange-700" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-orange-700" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowSummary(false);
                    setVideoSummary(null);
                    setSummaryPinned(false);
                  }}
                  className="p-1.5 hover:bg-orange-400/30 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-orange-700" />
                </button>
              </div>
            </div>

            {/* Sticky Note Content */}
            {!summaryMinimized && (
              <div className="p-4 overflow-y-auto h-[calc(100%-3.5rem)] custom-scrollbar">
                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-3" />
                    <p className="text-orange-800 font-medium">Analyzing video...</p>
                    <p className="text-orange-700 text-sm">Extracting key insights</p>
                  </div>
                ) : videoSummary ? (
                  <div className="space-y-4">
                    {/* Video Title */}
                    <div className="pb-2 border-b-2 border-orange-300">
                      <h4 className="font-bold text-orange-900 text-sm line-clamp-2">
                        {videoSummary.video_title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-orange-700">
                        <Clock className="w-3 h-3" />
                        {videoSummary.duration_minutes} min
                        {videoSummary.language && (
                          <>
                            <span>•</span>
                            <span>{videoSummary.language}</span>
                          </>
                        )}
                        {videoSummary.from_cache && (
                          <span className="px-1.5 py-0.5 bg-green-600/20 text-green-700 rounded text-xs">
                            Cached
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-orange-800 flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          Summary
                        </h5>
                        <button
                          onClick={() => copyToClipboard(videoSummary.summary, 'summary')}
                          className="p-1 hover:bg-orange-300/30 rounded transition-colors"
                        >
                          {copiedSection === 'summary' ? (
                            <Check className="w-4 h-4 text-green-700" />
                          ) : (
                            <Copy className="w-4 h-4 text-orange-700" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed bg-white/50 p-3 rounded-lg">
                        {videoSummary.summary}
                      </p>
                    </div>

                    {/* Key Points */}
                    {videoSummary.key_points && videoSummary.key_points.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-bold text-orange-800 flex items-center gap-1">
                          <List className="w-4 h-4" />
                          Key Points
                        </h5>
                        <ul className="space-y-1">
                          {videoSummary.key_points.map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-orange-600 mt-1">•</span>
                              <span className="text-sm text-gray-800">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Topics Covered */}
                    {videoSummary.topics_covered && videoSummary.topics_covered.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-bold text-orange-800 flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          Topics Covered
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {videoSummary.topics_covered.map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-300/50 text-orange-900 rounded-full text-xs font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Timestamps */}
                    {videoSummary.timestamps && videoSummary.timestamps.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-bold text-orange-800 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Key Moments
                        </h5>
                        <div className="space-y-1">
                          {videoSummary.timestamps.map((timestamp, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm hover:bg-orange-200/30 p-1 rounded cursor-pointer"
                            >
                              <span className="text-orange-700 font-mono font-bold">
                                {timestamp.timestamp}
                              </span>
                              <span className="text-gray-700 text-xs flex-1">
                                {timestamp.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-orange-800">No summary available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Add custom scrollbar styles
const styles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(251, 191, 36, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(251, 146, 60, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 146, 60, 0.7);
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}