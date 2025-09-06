'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/curriculum/subjects?user_id=${user?.id}`
      );
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Your Subjects</h1>
      <p className="text-gray-600 mb-6">Select a subject to start learning</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.code}
            onClick={() => router.push(`/dashboard/subjects/${subject.code}`)}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
            style={{ borderTop: `4px solid ${subject.color}` }}
          >
            <div className="text-4xl mb-3">{subject.icon}</div>
            <h2 className="text-xl font-bold mb-1">{subject.name}</h2>
            <p className="text-gray-600 text-sm mb-4">
              {subject.chapters?.length || 0} Chapters
            </p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{subject.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${subject.progress || 0}%` }}
                />
              </div>
            </div>
            
            <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg">
              Start Learning
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}