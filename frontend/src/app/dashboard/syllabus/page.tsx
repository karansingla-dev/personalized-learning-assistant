// frontend/src/app/dashboard/syllabus/page.tsx
'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import PdfUploader from '@/components/PdfUploader';

interface UploadedSyllabus {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  topicsCount?: number;
}

export default function SyllabusPage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  const [uploadedSyllabi, setUploadedSyllabi] = useState<UploadedSyllabus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadSuccess = (result: any) => {
    // Add new syllabus to the list
    const newSyllabus: UploadedSyllabus = {
      id: result.id || Date.now().toString(),
      fileName: result.fileName || 'syllabus.pdf',
      uploadedAt: new Date().toISOString(),
      status: 'processing',
    };
    
    setUploadedSyllabi(prev => [newSyllabus, ...prev]);
    setIsProcessing(true);

    // Simulate processing completion
    setTimeout(() => {
      setUploadedSyllabi(prev => 
        prev.map(s => 
          s.id === newSyllabus.id 
            ? { ...s, status: 'completed', topicsCount: 15 }
            : s
        )
      );
      setIsProcessing(false);
    }, 5000);
  };

  const handleViewSyllabus = (syllabusId: string) => {
    router.push(`/dashboard/syllabus/${syllabusId}`);
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to upload syllabus</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Syllabus Management
        </h1>
        <p className="text-gray-600">
          Upload your course syllabus and let AI extract important topics for you
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload New Syllabus
        </h2>
        <PdfUploader 
          userId={userId}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>

      {/* Uploaded Syllabi List */}
      {uploadedSyllabi.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Uploaded Syllabi
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
                        : 'bg-red-100 text-red-800'}
                    `}>
                      {syllabus.status === 'processing' ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : syllabus.status === 'completed' ? (
                        `${syllabus.topicsCount} topics extracted`
                      ) : (
                        'Failed'
                      )}
                    </span>
                    
                    {/* View Button */}
                    {syllabus.status === 'completed' && (
                      <button
                        onClick={() => handleViewSyllabus(syllabus.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        View Topics
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}