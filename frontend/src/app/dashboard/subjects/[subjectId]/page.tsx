'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';

interface Topic {
  _id: string;
  name: string;
  description: string;
  chapter_number: number;
  importance: number;
  difficulty: string;
  estimated_hours: number;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function SubjectTopicsPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectId && userId) {
      fetchSubjectAndTopics();
    }
  }, [subjectId, userId]);

  const fetchSubjectAndTopics = async () => {
    try {
      setLoading(true);
      
      // Fetch subject details
      const subjectRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subjects/${subjectId}`
      );
      
      if (subjectRes.ok) {
        const subjectData = await subjectRes.json();
        setSubject(subjectData);
      }
      
      // Fetch topics
      const topicsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subjects/${subjectId}/topics?user_id=${userId}`
      );
      
      if (topicsRes.ok) {
        const topicsData = await topicsRes.json();
        setTopics(topicsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topicId: string) => {
    router.push(`/dashboard/topics/${topicId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getImportanceBars = (importance: number) => {
    const bars = [];
    for (let i = 0; i < 10; i++) {
      bars.push(
        <div
          key={i}
          className={`h-2 w-1 ${i < importance ? 'bg-purple-500' : 'bg-gray-300'}`}
        />
      );
    }
    return bars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {subject && (
              <div className="flex items-center">
                <span className="text-3xl mr-3">{subject.icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
                  <p className="text-sm text-gray-600">{topics.length} Topics</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div
              key={topic._id}
              onClick={() => handleTopicClick(topic._id)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer p-6 group"
            >
              {/* Chapter Badge */}
              <div className="flex items-start justify-between mb-3">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Chapter {topic.chapter_number}
                </span>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(topic.difficulty)}`}>
                  {topic.difficulty}
                </span>
              </div>

              {/* Topic Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                {topic.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {topic.description}
              </p>

              {/* Meta Info */}
              <div className="space-y-2">
                {/* Importance */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Importance</span>
                  <div className="flex gap-0.5">
                    {getImportanceBars(topic.importance)}
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estimated Time</span>
                  <span className="text-xs font-medium text-gray-700">
                    {topic.estimated_hours} hours
                  </span>
                </div>
              </div>

              {/* Start Learning Button */}
              <button className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Start Learning →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}