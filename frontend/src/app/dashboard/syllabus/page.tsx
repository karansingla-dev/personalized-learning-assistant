// frontend/src/app/dashboard/syllabus/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import PdfUploader from '@/components/PdfUploader';
import { showToast } from '@/lib/toast';

interface UploadedSyllabus {
  id: string;
  fileName: string;
  file_name?: string;
  uploadedAt: string;
  uploaded_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  topics?: any[];
  topicsCount?: number;
  metadata?: any;
}

export default function SyllabusPage() {
  const { userId, isLoaded, isSignedIn } = useAuth(); // Add isLoaded and isSignedIn
  const { user } = useUser();
  const router = useRouter();
  
  const [uploadedSyllabi, setUploadedSyllabi] = useState<UploadedSyllabus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // Prevent double fetching

  // Debug logging
  useEffect(() => {
    console.log('Auth state changed:', {
      isLoaded,
      isSignedIn,
      userId,
      hasFetched
    });
  }, [isLoaded, isSignedIn, userId, hasFetched]);

  // Main effect to fetch syllabi
  useEffect(() => {
    // Don't do anything until auth is loaded
    if (!isLoaded) {
      console.log('Waiting for auth to load...');
      return;
    }

    // If auth is loaded but user not signed in
    if (isLoaded && !isSignedIn) {
      console.log('User not signed in');
      setIsLoading(false);
      return;
    }

    // If we have a userId and haven't fetched yet
    if (isLoaded && isSignedIn && userId && !hasFetched) {
      console.log('Ready to fetch, userId:', userId);
      fetchSyllabi();
      setHasFetched(true); // Mark as fetched
    }
  }, [isLoaded, isSignedIn, userId, hasFetched]);

  const fetchSyllabi = async () => {
    if (!userId) {
      console.log('fetchSyllabi called without userId');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Starting fetch for userId:', userId);
      setIsLoading(true);
      
      // Direct fetch to ensure it happens
      const url = `http://localhost:8000/api/v1/syllabus/list?user_id=${userId}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('Response received:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);
      
      // Map API response to component format
      const formattedSyllabi = (Array.isArray(data) ? data : []).map((s: any) => ({
        id: s.id || s._id || '',
        fileName: s.file_name || s.fileName || 'Unknown',
        uploadedAt: s.uploaded_at || s.uploadedAt || new Date().toISOString(),
        status: s.status || 'completed',
        topics: s.topics || [],
        topicsCount: s.topics_count || s.topicsCount || s.topics?.length || 0,
        metadata: s.metadata || {}
      }));
      
      console.log('Formatted syllabi:', formattedSyllabi);
      setUploadedSyllabi(formattedSyllabi);
      
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      showToast.error('Failed to load syllabi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (result: any) => {
    console.log('Upload successful:', result);
    
    const newSyllabus: UploadedSyllabus = {
      id: result.id || Date.now().toString(),
      fileName: result.fileName || 'syllabus.pdf',
      uploadedAt: new Date().toISOString(),
      status: result.status || 'completed',
      topicsCount: result.topics_count || result.topicsCount || 0
    };
    
    setUploadedSyllabi(prev => [newSyllabus, ...prev]);
    showToast.success('Syllabus uploaded successfully!');
    
    // Reset fetch flag and refetch
    setHasFetched(false);
  };

  const handleViewSyllabus = (syllabusId: string) => {
    console.log('Navigating to syllabus:', syllabusId);
    router.push(`/dashboard/syllabus/${syllabusId}`);
  };

  const handleDeleteSyllabus = async (syllabusId: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/syllabus/${syllabusId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setUploadedSyllabi(prev => prev.filter(s => s.id !== syllabusId));
        showToast.success('Syllabus deleted successfully');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting syllabus:', error);
      showToast.error('Failed to delete syllabus');
    }
  };

  // Manual refresh button for debugging
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    setHasFetched(false);
    if (userId) {
      fetchSyllabi();
      setHasFetched(true);
    }
  };

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to manage syllabi</p>
          <button
            onClick={() => router.push('/sign-in')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Syllabus Management
            </h1>
            <p className="text-gray-600">
              Upload your course syllabus and let AI extract important topics for you
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload New Syllabus
        </h2>
        <PdfUploader 
          userId={userId!}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading syllabi...</p>
          </div>
        </div>
      )}

      {/* Uploaded Syllabi List */}
      {!isLoading && uploadedSyllabi.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Uploaded Syllabi ({uploadedSyllabi.length})
          </h2>
          <div className="grid gap-4">
            {uploadedSyllabi.map((syllabus) => (
              <div 
                key={syllabus.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{syllabus.fileName}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(syllabus.uploadedAt).toLocaleDateString()}
                        {syllabus.metadata?.page_count && (
                          <span className="ml-2">• {syllabus.metadata.page_count} pages</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Status Badge */}
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${syllabus.status === 'processing' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : syllabus.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : syllabus.status === 'pending'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'}
                    `}>
                      {syllabus.status === 'completed' 
                        ? `${syllabus.topicsCount || 0} topics`
                        : syllabus.status
                      }
                    </span>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {syllabus.status === 'completed' && (
                        <button
                          onClick={() => handleViewSyllabus(syllabus.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          View Topics
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteSyllabus(syllabus.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete syllabus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && uploadedSyllabi.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No syllabi uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading your first syllabus.</p>
          <button
            onClick={handleManualRefresh}
            className="mt-4 text-blue-600 underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}