// frontend/src/components/BlogReader.tsx
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen, Clock, ExternalLink } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  source: string;
  url: string;
  content: string;
  ai_summary?: string;
  reading_time: string;
  quality_score?: number;
  images?: Array<{ url: string; alt: string; caption: string }>;
}

interface BlogReaderProps {
  blogs: Blog[];
  topicName: string;
  onClose: () => void;
}

export default function BlogReader({ blogs, topicName, onClose }: BlogReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  
  const currentBlog = blogs[currentIndex];
  
  const handleNext = () => {
    if (currentIndex < blogs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowSummary(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowSummary(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Educational Blogs: {topicName}</h1>
                <p className="text-sm text-blue-100">
                  Reading {currentIndex + 1} of {blogs.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Navigation Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 overflow-x-auto">
              {blogs.map((blog, index) => (
                <button
                  key={blog.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    index === currentIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}. {blog.source}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === blogs.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="max-w-4xl mx-auto p-6 overflow-y-auto h-[calc(100vh-140px)]">
        {/* Blog Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {currentBlog.title}
          </h2>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {currentBlog.reading_time} read
              </span>
              <span>Source: {currentBlog.source}</span>
              {currentBlog.quality_score && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  Quality: {currentBlog.quality_score.toFixed(1)}/10
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {showSummary ? 'Full Content' : 'AI Summary'}
              </button>
              <a
                href={currentBlog.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Original
              </a>
            </div>
          </div>
        </div>
        
        {/* AI Summary */}
        {showSummary && currentBlog.ai_summary && (
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
              <span className="mr-2">🤖</span> AI Summary
            </h3>
            <div className="text-gray-700 whitespace-pre-line">
              {currentBlog.ai_summary}
            </div>
          </div>
        )}
        
        {/* Blog Content */}
        {!showSummary && (
          <div className="prose prose-lg max-w-none">
            {/* Images */}
            {currentBlog.images && currentBlog.images.length > 0 && (
              <div className="mb-6">
                {currentBlog.images.map((image, index) => (
                  <figure key={index} className="mb-4">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="rounded-lg shadow-md w-full max-w-2xl mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {image.caption && (
                      <figcaption className="text-center text-sm text-gray-600 mt-2">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
            
            {/* Main Content */}
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {currentBlog.content}
            </div>
          </div>
        )}
        
        {/* Navigation Footer */}
        <div className="mt-8 pt-6 border-t flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === blogs.length - 1}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}