// frontend/src/app/dashboard/topics/[topicId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Brain, 
  ArrowLeft, 
  RefreshCw,
  Download,
  BookOpen,
  Calculator,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Copy,
  Zap,
  Trophy,
  Star,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Flame,
  Rocket,
  Code,
  Eye,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Video,
  PlayCircle,
  FileText,
  Newspaper
} from 'lucide-react';

// Dynamically import TopicVideos to avoid SSR issues
const TopicVideos = dynamic(() => import('@/components/TopicVideos'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-white/60">Loading videos...</p>
      </div>
    </div>
  )
});

// Interfaces
interface AISummaryData {
  topic_name: string;
  subject: string;
  class_level: number;
  generated_at: string;
  overview: string;
  key_concepts: string[];
  formulas: string[];
  solved_examples: string[];
  important_questions: string[];
  common_mistakes: string[];
  tips_and_tricks: string[];
  revision_notes: string[];
  from_cache?: boolean;
}

// Math Formula Component
const MathFormula = ({ formula, block = false }: { formula: string; block?: boolean }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      const processedFormula = formula
        .replace(/\*/g, ' \\cdot ')
        .replace(/\^([0-9]+)/g, '^{$1}')
        .replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}');
      
      const renderedHtml = katex.renderToString(processedFormula, {
        throwOnError: false,
        displayMode: block
      });
      setHtml(renderedHtml);
    } catch (err) {
      setHtml(`<span style="color: #fff;">${formula}</span>`);
    }
  }, [formula, block]);

  return (
    <span 
      dangerouslySetInnerHTML={{ __html: html }}
      className={block ? 'block text-center my-4 text-xl' : 'inline-block'}
      style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))' }}
    />
  );
};

// Formula Card Component
const FormulaCard = ({ formula, index }: { formula: string; index: number }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const copyFormula = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div 
      className="formula-card rounded-2xl p-6 hover-lift cursor-pointer group"
      style={{ 
        animationDelay: `${index * 0.1}s`,
        background: `linear-gradient(135deg, 
          hsl(${220 + index * 30}, 70%, 50%) 0%, 
          hsl(${250 + index * 30}, 70%, 60%) 100%)`
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold">{index + 1}</span>
            </div>
            <span className="text-white/80 text-sm font-medium">Formula {index + 1}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyFormula();
            }}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
          >
            {copied ? 
              <CheckCircle className="w-5 h-5 text-green-300" /> : 
              <Copy className="w-5 h-5 text-white" />
            }
          </button>
        </div>
        
        <div className="bg-black/30 rounded-xl p-6 backdrop-blur">
          <MathFormula formula={formula} block={true} />
        </div>
      </div>
    </div>
  );
};

// Solved Example Component (Fixed)
const SolvedExample = ({ example, index }: { example: string; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const parseExample = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const problem = lines[0] || '';
    const solution = lines.slice(1);
    
    const steps = [];
    let currentStep = [];
    
    for (const line of solution) {
      if (line.match(/^(Step|Solution|Given|To find|Formula|Answer)/i)) {
        if (currentStep.length > 0) {
          steps.push(currentStep.join('\n'));
          currentStep = [];
        }
      }
      currentStep.push(line);
    }
    
    if (currentStep.length > 0) {
      steps.push(currentStep.join('\n'));
    }
    
    return { problem, steps: steps.length > 0 ? steps : [solution.join('\n')] };
  };
  
  const { problem, steps } = parseExample(example);
  
  const handleMainClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button')) {
      setExpanded(!expanded);
    }
  };
  
  return (
    <div 
      className="gradient-border rounded-2xl overflow-hidden hover-lift fade-in"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur">
        <div
          onClick={handleMainClick}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">{index + 1}</span>
            </div>
            <div className="text-left">
              <h4 className="text-white font-bold text-lg flex items-center">
                Example {index + 1}
                {index === 0 && <span className="ml-2 px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full">Easy</span>}
                {index === 1 && <span className="ml-2 px-2 py-1 bg-yellow-500/30 text-yellow-300 text-xs rounded-full">Medium</span>}
                {index === 2 && <span className="ml-2 px-2 py-1 bg-red-500/30 text-red-300 text-xs rounded-full">Hard</span>}
              </h4>
              <p className="text-gray-300 text-sm mt-1 line-clamp-1">{problem}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition z-10"
            >
              <Star className={`w-5 h-5 ${liked ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
            </button>
            <div className="pointer-events-none">
              {expanded ? 
                <ChevronUp className="w-5 h-5 text-white" /> : 
                <ChevronDown className="w-5 h-5 text-white" />
              }
            </div>
          </div>
        </div>
        
        {expanded && (
          <div className="border-t border-white/10 p-6 space-y-4 fade-in">
            <div className="glass-effect rounded-xl p-4">
              <h5 className="text-purple-300 font-semibold mb-3">Problem:</h5>
              <p className="text-white text-lg">{problem}</p>
            </div>
            
            <div className="glass-effect rounded-xl p-4">
              <h5 className="text-blue-300 font-semibold mb-3">Solution:</h5>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-200">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const topicId = params.topicId as string;
  
  const [summaryData, setSummaryData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'videos' | 'articles'>('summary');
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    if (topicId) {
      fetchAISummary();
    }
  }, [topicId]);

  const fetchAISummary = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ai-summary/${topicId}${forceRefresh ? '?force_refresh=true' : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI summary');
      }
      
      const data = await response.json();
      setSummaryData(data);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await fetchAISummary(true);
  };

  const downloadSummary = () => {
    if (!summaryData) return;
    
    const content = `${summaryData.topic_name} - AI Study Guide\n\n${summaryData.overview}\n\nKEY CONCEPTS:\n${summaryData.key_concepts.join('\n')}\n\nFORMULAS:\n${summaryData.formulas.join('\n')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summaryData.topic_name.replace(/\s+/g, '_')}_Study_Guide.txt`;
    a.click();
  };

  // Main tabs configuration
  const mainTabs = [
    { 
      id: 'summary', 
      title: 'AI Summary', 
      icon: <Brain className="w-5 h-5" />, 
      description: 'AI-generated comprehensive study guide'
    },
    { 
      id: 'videos', 
      title: 'Videos', 
      icon: <PlayCircle className="w-5 h-5" />, 
      description: 'Video tutorials from YouTube'
    },
    { 
      id: 'articles', 
      title: 'Articles', 
      icon: <Newspaper className="w-5 h-5" />, 
      description: 'Reference articles and blogs'
    }
  ];

  // AI Summary sub-sections
  const summarySections = [
    { id: 'overview', title: 'Overview', icon: <Rocket className="w-4 h-4" /> },
    { id: 'concepts', title: 'Concepts', icon: <Brain className="w-4 h-4" /> },
    { id: 'formulas', title: 'Formulas', icon: <Calculator className="w-4 h-4" /> },
    { id: 'examples', title: 'Examples', icon: <Code className="w-4 h-4" /> },
    { id: 'questions', title: 'Questions', icon: <Target className="w-4 h-4" /> },
    { id: 'mistakes', title: 'Mistakes', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'tips', title: 'Tips', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'revision', title: 'Revision', icon: <Zap className="w-4 h-4" /> }
  ];

  // Animation styles
  const styles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    
    .hover-lift {
      transition: all 0.3s ease;
    }
    
    .hover-lift:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .gradient-border {
      position: relative;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%) border-box;
      border: 3px solid transparent;
    }
    
    .formula-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }
  `;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-white text-xl">Loading topic content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="glass-effect rounded-3xl p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">Error Loading Content</h2>
          <p className="text-gray-300 text-center mb-6">{error}</p>
          <button
            onClick={() => fetchAISummary()}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="glass-effect border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    {summaryData?.topic_name}
                    <Sparkles className="w-6 h-6 ml-3 text-yellow-400" />
                  </h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-sm">
                      {summaryData?.subject}
                    </span>
                    <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm">
                      Class {summaryData?.class_level}
                    </span>
                    {summaryData?.from_cache && (
                      <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-sm">
                        Cached
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <button
                  onClick={downloadSummary}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="glass-effect border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8 py-4">
              {mainTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <div className="text-left">
                    <p className="font-semibold">{tab.title}</p>
                    <p className="text-xs opacity-80">{tab.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-navigation for AI Summary */}
        {activeTab === 'summary' && (
          <div className="bg-black/20 backdrop-blur">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex space-x-2 overflow-x-auto py-3">
                {summarySections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* AI Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="glass-effect rounded-2xl p-8 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Rocket className="w-6 h-6 mr-3 text-blue-400" />
                  Topic Overview
                </h2>
                <p className="text-gray-200 leading-relaxed text-lg">
                  {summaryData?.overview}
                </p>
              </div>
            )}

            {/* Key Concepts */}
            {activeSection === 'concepts' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-purple-400" />
                  Key Concepts
                </h2>
                {summaryData?.key_concepts.map((concept, index) => (
                  <div key={index} className="glass-effect rounded-xl p-5 hover-lift">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-200 flex-1">{concept}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulas */}
            {activeSection === 'formulas' && (
              <div className="space-y-6 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Calculator className="w-6 h-6 mr-3 text-green-400" />
                  Important Formulas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaryData?.formulas.map((formula, index) => (
                    <FormulaCard key={index} formula={formula} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            {activeSection === 'examples' && (
              <div className="space-y-6 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Code className="w-6 h-6 mr-3 text-orange-400" />
                  Solved Examples
                </h2>
                {summaryData?.solved_examples.map((example, index) => (
                  <SolvedExample key={index} example={example} index={index} />
                ))}
              </div>
            )}

            {/* Questions */}
            {activeSection === 'questions' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-3 text-indigo-400" />
                  Important Exam Questions
                </h2>
                {summaryData?.important_questions.map((question, index) => (
                  <div key={index} className="glass-effect rounded-xl p-5 hover-lift">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">Q{index + 1}</span>
                      </div>
                      <p className="text-gray-200 flex-1">{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Common Mistakes */}
            {activeSection === 'mistakes' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3 text-red-400" />
                  Common Mistakes to Avoid
                </h2>
                {summaryData?.common_mistakes.map((mistake, index) => (
                  <div key={index} className="glass-effect rounded-xl p-5 border-l-4 border-red-500 hover-lift">
                    <div className="flex items-start space-x-4">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-200 flex-1">{mistake}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tips & Tricks */}
            {activeSection === 'tips' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
                  Tips & Tricks
                </h2>
                {summaryData?.tips_and_tricks.map((tip, index) => (
                  <div key={index} className="glass-effect rounded-xl p-5 border-l-4 border-yellow-500 hover-lift">
                    <div className="flex items-start space-x-4">
                      <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-200 flex-1">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revision Notes */}
            {activeSection === 'revision' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-teal-400" />
                  Quick Revision Notes
                </h2>
                <div className="glass-effect rounded-2xl p-6">
                  <ul className="space-y-3">
                    {summaryData?.revision_notes.map((note, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-200">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="fade-in">
            <TopicVideos 
              topicId={topicId}
              topicName={summaryData?.topic_name || ''}
              subjectName={summaryData?.subject || ''}
              classLevel={summaryData?.class_level || 10}
            />
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="glass-effect rounded-2xl p-8 fade-in">
            <div className="text-center py-12">
              <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Articles Coming Soon</h3>
              <p className="text-gray-400">
                We're working on bringing you the best educational articles and reference materials.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}