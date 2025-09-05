// frontend/src/app/dashboard/syllabus/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { syllabusService } from '@/lib/api/syllabus.service';
import { showToast } from '@/lib/toast';

interface Topic {
  id?: string;
  name: string;
  description: string;
  importance: number;
  prerequisites: string[];
  estimated_hours: number;
  progress?: number;
}

export default function TopicsPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const syllabusId = params.id as string;
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [syllabusInfo, setSyllabusInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [simplifyMode, setSimplifyMode] = useState(false);

  useEffect(() => {
    if (syllabusId) {
      fetchTopics();
      fetchSyllabusInfo();
    }
  }, [syllabusId]);

  const fetchSyllabusInfo = async () => {
    try {
      const syllabus = await syllabusService.getSyllabus(syllabusId);
      setSyllabusInfo(syllabus);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const topicsData = await syllabusService.getTopics(syllabusId);
      
      // Sort topics by importance (highest first)
      const sortedTopics = topicsData.sort((a, b) => b.importance - a.importance);
      setTopics(sortedTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      showToast.error('Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowExplanation(true);
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'text-red-600 bg-red-100';
    if (importance >= 6) return 'text-orange-600 bg-orange-100';
    if (importance >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 8) return 'Critical';
    if (importance >= 6) return 'Important';
    if (importance >= 4) return 'Moderate';
    return 'Basic';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Syllabus
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Extracted Topics
        </h1>
        <p className="text-gray-600">
          {syllabusInfo?.file_name || 'Syllabus'} • {topics.length} topics found
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Topics</div>
          <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Critical Topics</div>
          <div className="text-2xl font-bold text-red-600">
            {topics.filter(t => t.importance >= 8).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Est. Study Time</div>
          <div className="text-2xl font-bold text-blue-600">
            {topics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0)}h
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Prerequisites</div>
          <div className="text-2xl font-bold text-purple-600">
            {topics.filter(t => t.prerequisites && t.prerequisites.length > 0).length}
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic, index) => (
          <div
            key={topic.id || index}
            onClick={() => handleTopicClick(topic)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer transform hover:scale-105"
          >
            {/* Topic Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                {topic.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(topic.importance)}`}>
                {getImportanceLabel(topic.importance)}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {topic.description || 'No description available'}
            </p>

            {/* Topic Meta */}
            <div className="space-y-2">
              {/* Importance Bar */}
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-20">Importance:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      topic.importance >= 8 ? 'bg-red-600' :
                      topic.importance >= 6 ? 'bg-orange-600' :
                      topic.importance >= 4 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${topic.importance * 10}%` }}
                  />
                </div>
                <span className="text-xs text-gray-700 ml-2 font-medium">
                  {topic.importance}/10
                </span>
              </div>

              {/* Study Time */}
              <div className="flex items-center text-xs text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Est. {topic.estimated_hours || 1} hours
              </div>

              {/* Prerequisites */}
              {topic.prerequisites && topic.prerequisites.length > 0 && (
                <div className="flex items-start text-xs text-gray-600">
                  <svg className="w-4 h-4 mr-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="flex-1">
                    Requires: {topic.prerequisites.slice(0, 2).join(', ')}
                    {topic.prerequisites.length > 2 && ` +${topic.prerequisites.length - 2} more`}
                  </span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
              Start Learning →
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {topics.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No topics found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The AI couldn't extract topics from this syllabus.
          </p>
        </div>
      )}

      {/* Topic Detail Modal */}
      {showExplanation && selectedTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedTopic.name}
                </h2>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Toggle for Simplified Mode */}
              <div className="mb-6 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {simplifyMode ? "Simplified Explanation (ELI5)" : "Standard Explanation"}
                </span>
                <button
                  onClick={() => setSimplifyMode(!simplifyMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    simplifyMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    simplifyMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Topic Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">
                    {selectedTopic.description || 'No description available'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Importance Level</h3>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                        <div 
                          className={`h-3 rounded-full ${
                            selectedTopic.importance >= 8 ? 'bg-red-600' :
                            selectedTopic.importance >= 6 ? 'bg-orange-600' :
                            selectedTopic.importance >= 4 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${selectedTopic.importance * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{selectedTopic.importance}/10</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Study Time</h3>
                    <p className="text-gray-600">{selectedTopic.estimated_hours} hours</p>
                  </div>
                </div>

                {selectedTopic.prerequisites && selectedTopic.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Prerequisites</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.prerequisites.map((prereq, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Get Detailed Explanation
                  </button>
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                    Generate Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}