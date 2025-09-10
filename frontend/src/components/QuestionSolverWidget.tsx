// frontend/src/components/QuestionSolverWidget.tsx
// Quick access widget for sidebar or dashboard

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ArrowRight,
  FileText,
  Image
} from 'lucide-react';

export default function QuestionSolverWidget() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleQuickUpload = (file: File) => {
    // Store file in sessionStorage to pass to the main page
    const reader = new FileReader();
    reader.onload = (e) => {
      sessionStorage.setItem('quickUploadFile', JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        content: e.target?.result
      }));
      router.push('/dashboard/question-solver');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleQuickUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
          Quick Solve
        </h3>
        <button
          onClick={() => router.push('/dashboard/question-solver')}
          className="text-purple-400 hover:text-purple-300 transition"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
          dragActive 
            ? 'border-purple-400 bg-purple-500/10' 
            : 'border-white/30 hover:border-white/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
          onChange={(e) => e.target.files && handleQuickUpload(e.target.files[0])}
          className="hidden"
        />
        
        <div className="flex justify-center space-x-3 mb-3">
          <FileText className="w-8 h-8 text-white/40" />
          <Camera className="w-8 h-8 text-white/40" />
          <Image className="w-8 h-8 text-white/40" />
        </div>
        
        <p className="text-white/60 text-sm mb-3">
          Drop your homework here
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
      </div>

      {/* Recent Activity */}
      <div className="mt-4 space-y-2">
        <p className="text-white/60 text-xs">Recent:</p>
        <div className="space-y-1">
          <div className="flex items-center text-white/80 text-sm">
            <FileText className="w-3 h-3 mr-2 text-green-400" />
            <span className="truncate">Math_Homework.pdf</span>
          </div>
          <div className="flex items-center text-white/80 text-sm">
            <Image className="w-3 h-3 mr-2 text-blue-400" />
            <span className="truncate">Physics_Q3.jpg</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Mobile Floating Action Button (FAB)
// ============================================

export function QuestionSolverFAB() {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Process and redirect
        sessionStorage.setItem('capturedImage', file.name);
        router.push('/dashboard/question-solver');
      }
    };
    input.click();
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform lg:hidden"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {/* Options Menu */}
      {showOptions && (
        <div className="fixed bottom-24 right-6 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-2 z-50 lg:hidden">
          <button
            onClick={handleCameraCapture}
            className="w-full flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition"
          >
            <Camera className="w-5 h-5" />
            <span>Take Photo</span>
          </button>
          <button
            onClick={() => {
              setShowOptions(false);
              router.push('/dashboard/question-solver');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition"
          >
            <Upload className="w-5 h-5" />
            <span>Upload File</span>
          </button>
        </div>
      )}
    </>
  );
}