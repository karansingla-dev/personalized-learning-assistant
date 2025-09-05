// frontend/src/components/PdfUploader.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { showToast } from '@/lib/toast';

interface PdfUploaderProps {
  userId: string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: Error) => void;
}

export default function PdfUploader({ userId, onUploadSuccess, onUploadError }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        showToast.error('File size must be less than 10MB');
      } else if (error.code === 'file-invalid-type') {
        showToast.error('Only PDF files are allowed');
      } else {
        showToast.error('Invalid file');
      }
      return;
    }

    // Handle accepted file
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      showToast.info(`Selected: ${file.name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', userId);

      // Track upload progress
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Upload complete
      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/syllabus/upload`);
        xhr.responseType = 'json';
        xhr.send(formData);
      });

      const result = xhr.response;
      
      showToast.success('Syllabus uploaded successfully! Processing...');
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Failed to upload syllabus. Please try again.');
      
      if (onUploadError) {
        onUploadError(error as Error);
      }
      
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    showToast.info('File removed');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Dropzone */}
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : isDragReject
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'}
          `}
        >
          <input {...getInputProps()} />
          
          {/* Upload Icon */}
          <div className="mb-4 flex justify-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isDragActive ? 'bg-blue-100' : isDragReject ? 'bg-red-100' : 'bg-gray-100'}
            `}>
              <svg 
                className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : isDragReject ? 'text-red-600' : 'text-gray-400'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
          </div>
          
          {/* Instructions */}
          <div>
            {isDragActive ? (
              <p className="text-lg font-semibold text-blue-600">Drop your PDF here...</p>
            ) : isDragReject ? (
              <p className="text-lg font-semibold text-red-600">Only PDF files are accepted!</p>
            ) : (
              <>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Drag and drop your syllabus PDF here
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Browse Files
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Maximum file size: 10MB • Format: PDF only
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* File Selected */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              {/* PDF Icon */}
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* File Info */}
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {/* Remove Button */}
            {!isUploading && (
              <button
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition
                ${isUploading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
              `}
            >
              {isUploading ? 'Uploading...' : 'Upload Syllabus'}
            </button>
            
            {!isUploading && (
              <button
                onClick={handleRemoveFile}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {uploadProgress === 100 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800">
              Upload complete! Your syllabus is being processed by AI...
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          What happens next?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>AI analyzes your syllabus content</li>
          <li>Extracts important topics and concepts</li>
          <li>Generates personalized study materials</li>
          <li>Creates practice quizzes and notes</li>
        </ul>
      </div>
    </div>
  );
}