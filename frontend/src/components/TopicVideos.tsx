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
  User
} from 'lucide-react';

interface Video {
  id: string;
  video_id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  channel: string;
  author: string;
  duration_minutes: number;
  view_count?: number;
  like_count?: number;
  published_at?: string;
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

  useEffect(() => {
    fetchVideos();
  }, [topicId]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch videos from your backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/topics/${topicId}/videos?` +
        `topic_name=${encodeURIComponent(topicName)}&` +
        `subject_name=${encodeURIComponent(subjectName)}&` +
        `class_level=${classLevel}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      console.log('Fetched videos:', data);
      setVideos(data.videos || []);
      
      // Auto-select first video
      if (data.videos && data.videos.length > 0) {
        setSelectedVideo(data.videos[0]);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatViewCount = (count?: number) => {
    if (!count) return '0 views';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
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
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchVideos}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">No videos found for this topic</p>
        <button
          onClick={fetchVideos}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player Section */}
      {selectedVideo && (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10">
          {/* YouTube Embed */}
          <div className="relative aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.video_id}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              onLoad={() => setIsPlaying(true)}
            />
          </div>
          
          {/* Video Info */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-2">{selectedVideo.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {selectedVideo.channel}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(selectedVideo.duration_minutes)}
              </div>
              {selectedVideo.view_count && (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {formatViewCount(selectedVideo.view_count)}
                </div>
              )}
            </div>
            
            {/* Description */}
            {selectedVideo.description && (
              <p className="mt-4 text-gray-300 text-sm line-clamp-3">
                {selectedVideo.description}
              </p>
            )}
            
            {/* Actions */}
            <div className="flex items-center space-x-3 mt-4">
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Watch on YouTube
              </a>
              <button
                onClick={() => {
                  // Add to watchlist functionality
                  console.log('Add to watchlist:', selectedVideo.id);
                }}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                Save for Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Related Videos ({videos.length})
          </h3>
          <button
            onClick={fetchVideos}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            title="Refresh videos"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => {
                setSelectedVideo(video);
                setIsPlaying(false);
              }}
              className={`
                bg-white/5 backdrop-blur rounded-xl overflow-hidden border transition-all cursor-pointer group
                ${selectedVideo?.id === video.id 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-white/10 hover:border-white/30 hover:bg-white/10'
                }
              `}
            >
              <div className="flex">
                {/* Thumbnail */}
                <div className="relative w-40 h-24 flex-shrink-0">
                  {video.is_placeholder ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                      <PlayCircle className="w-8 h-8 text-white/40" />
                    </div>
                  ) : (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if thumbnail fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                            <svg class="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
                    {formatDuration(video.duration_minutes)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-3">
                  <h4 className="text-white font-medium text-sm line-clamp-2 mb-1 group-hover:text-purple-300 transition">
                    {video.title}
                  </h4>
                  <p className="text-gray-400 text-xs mb-2">{video.channel}</p>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {video.view_count && (
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {formatViewCount(video.view_count)}
                      </span>
                    )}
                    {video.published_at && (
                      <span>
                        {new Date(video.published_at).toLocaleDateString()}
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
  );
}