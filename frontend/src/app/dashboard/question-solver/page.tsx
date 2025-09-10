// frontend/src/app/dashboard/question-solver/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  Upload, 
  FileText, 
  Image, 
  Send, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  Calculator,
  BookOpen,
  Sparkles,
  FileDown,
  ChevronDown,
  ChevronUp,
  Camera,
  Edit3,
  Zap,
  Brain,
  FileImage,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SolvedQuestion {
  number: number;
  question: string;
  solution: string;
  steps: string[];
  final_answer: string;
  explanation: string;
}

interface SolutionResponse {
  success: boolean;
  message: string;
  questions_found: number;
  questions_solved: number;
  solved_questions: SolvedQuestion[];
  pdf_path?: string;
}

export default function QuestionSolverPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [singleQuestion, setSingleQuestion] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [solutions, setSolutions] = useState<SolvedQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'upload' | 'single'>('upload');
  const [dragActive, setDragActive] = useState(false);

  // Subjects list
  const subjects = [
    'Mathematics',
    'Physics', 
    'Chemistry',
    'Biology',
    'Computer Science',
    'Economics',
    'English',
    'History',
    'Geography',
    'General'
  ];

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, DOCX, or image file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSolutions(null);
  };

  // Handle drag and drop
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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload and solve
  const handleUploadAndSolve = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', subject);
      formData.append('class_level', classLevel.toString());
      formData.append('student_name', user?.firstName || 'Student');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/question-solver/upload-and-solve`,
        {
          method: 'POST',
          body: formData
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process file');
      }

      const data: SolutionResponse = await response.json();
      
      if (data.success) {
        setSolutions(data.solved_questions);
        
        // Generate PDF download URL if available
        if (data.pdf_path) {
          const filename = data.pdf_path.split('/').pop();
          setPdfUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/question-solver/download-pdf/${filename}`);
        }
      } else {
        throw new Error(data.message || 'Failed to solve questions');
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // Solve single question
  const handleSolveSingle = async () => {
    if (!singleQuestion.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('question', singleQuestion);
      formData.append('subject', subject);
      formData.append('class_level', classLevel.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/question-solver/solve-single`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to solve question');
      }

      const data = await response.json();
      
      if (data.success) {
        setSolutions([{
          number: 1,
          question: singleQuestion,
          solution: data.solution.solution || '',
          steps: data.solution.steps || [],
          final_answer: data.solution.final_answer || '',
          explanation: data.solution.explanation || ''
        }]);
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to solve question');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle question expansion
  const toggleQuestion = (num: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(num)) {
        newSet.delete(num);
      } else {
        newSet.add(num);
      }
      return newSet;
    });
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!pdfUrl) return;
    
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solutions_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download PDF');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-white/70 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-white flex items-center mb-2">
            <Brain className="w-8 h-8 mr-3 text-purple-400" />
            AI Question Solver
          </h1>
          <p className="text-white/60">
            Upload your question paper or type a question to get step-by-step solutions
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center ${
              activeTab === 'upload'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center ${
              activeTab === 'single'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Edit3 className="w-5 h-5 mr-2" />
            Single Question
          </button>
        </div>

        {/* Settings */}
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 mb-2">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                {subjects.map(subj => (
                  <option key={subj} value={subj} className="bg-gray-800">
                    {subj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/70 mb-2">Class Level</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                {[6, 7, 8, 9, 10, 11, 12].map(level => (
                  <option key={level} value={level} className="bg-gray-800">
                    Class {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Upload Question Paper</h2>
            
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                dragActive 
                  ? 'border-purple-400 bg-purple-500/10' 
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-4">
                  <FileText className="w-16 h-16 text-purple-400 mx-auto" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-white/60 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <FileText className="w-12 h-12 text-white/40" />
                    <Image className="w-12 h-12 text-white/40" />
                    <Camera className="w-12 h-12 text-white/40" />
                  </div>
                  <div>
                    <p className="text-white mb-2">
                      Drag and drop your file here, or
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      Browse Files
                    </button>
                  </div>
                  <p className="text-white/60 text-sm">
                    Supports PDF, DOCX, PNG, JPG (Max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isProcessing && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/60 mb-1">
                  <span>Processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Solve Button */}
            <button
              onClick={handleUploadAndSolve}
              disabled={!file || isProcessing}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Questions...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Solve Questions
                </>
              )}
            </button>
          </div>
        )}

        {/* Single Question Tab */}
        {activeTab === 'single' && (
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Enter Your Question</h2>
            
            <textarea
              value={singleQuestion}
              onChange={(e) => setSingleQuestion(e.target.value)}
              placeholder="Type or paste your question here. For example: 'Solve the quadratic equation x² + 5x + 6 = 0' or 'What is photosynthesis?'"
              className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 resize-none"
            />

            <div className="mt-2 text-white/50 text-sm">
              Tip: Be specific and include all details from your question
            </div>

            <button
              onClick={handleSolveSingle}
              disabled={!singleQuestion.trim() || isProcessing}
              className="mt-4 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Solving...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-2" />
                  Get Solution
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <p className="text-red-400">{error}</p>
                <p className="text-red-400/70 text-sm mt-1">
                  Please check your file format and try again
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Solutions Display */}
        {solutions && solutions.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
                Solutions ({solutions.length} {solutions.length === 1 ? 'question' : 'questions'})
              </h2>
              
              {pdfUrl && (
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>
              )}
            </div>

            {/* Questions and Solutions */}
            <div className="space-y-4">
              {solutions.map((sol) => (
                <div
                  key={sol.number}
                  className="glass-effect rounded-xl overflow-hidden"
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleQuestion(sol.number)}
                    className="w-full px-6 py-4 flex justify-between items-start text-left hover:bg-white/5 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                          Question {sol.number}
                        </span>
                      </div>
                      <p className="text-white font-medium">{sol.question}</p>
                    </div>
                    {expandedQuestions.has(sol.number) ? (
                      <ChevronUp className="w-5 h-5 text-white/60 ml-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60 ml-4 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded Solution */}
                  {expandedQuestions.has(sol.number) && (
                    <div className="px-6 pb-6 border-t border-white/10">
                      {/* Solution */}
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center">
                          <BookOpen className="w-5 h-5 mr-2" />
                          Solution:
                        </h3>
                        
                        {sol.steps && sol.steps.length > 0 ? (
                          <div className="space-y-3">
                            {sol.steps.map((step, idx) => (
                              <div key={idx} className="flex items-start">
                                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                  {idx + 1}
                                </span>
                                <p className="text-white/90">{step}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/90 whitespace-pre-wrap">{sol.solution}</p>
                        )}
                      </div>

                      {/* Final Answer */}
                      {sol.final_answer && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <h4 className="text-green-400 font-semibold mb-1 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Final Answer:
                          </h4>
                          <p className="text-white font-medium">{sol.final_answer}</p>
                        </div>
                      )}

                      {/* Explanation */}
                      {sol.explanation && (
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <h4 className="text-blue-400 font-semibold mb-1 flex items-center">
                            <Eye className="w-5 h-5 mr-2" />
                            Explanation:
                          </h4>
                          <p className="text-white/90">{sol.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setSolutions(null);
                  setFile(null);
                  setSingleQuestion('');
                  setError(null);
                }}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-semibold"
              >
                Solve More Questions
              </button>
              {pdfUrl && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition font-semibold flex items-center justify-center"
                >
                  <FileDown className="w-5 h-5 mr-2" />
                  Save as PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}