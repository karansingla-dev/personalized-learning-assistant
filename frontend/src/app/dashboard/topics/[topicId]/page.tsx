// frontend/src/app/dashboard/topics/[topicId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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
  Volume2
} from 'lucide-react';

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

// Custom styles for animations
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .float-animation {
    animation: float 3s ease-in-out infinite;
  }
  
  .glow-animation {
    animation: glow 2s ease-in-out infinite;
  }
  
  .pulse-animation {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .slide-in {
    animation: slideIn 0.5s ease-out;
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease-out;
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
  
  .neon-text {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
  }
  
  .hover-lift {
    transition: all 0.3s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
  
  .stagger-animation {
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
  }
  
  .formula-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
  }
  
  .formula-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }
`;

// Math formula renderer with enhanced UI
const MathFormula = ({ formula, block = false }: { formula: string, block?: boolean }) => {
  const [html, setHtml] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      let processedFormula = formula;
      
      if (formula.includes('$$') || formula.includes('\\[') || formula.includes('\\(')) {
        processedFormula = formula
          .replace(/\$\$(.*?)\$\$/g, '$1')
          .replace(/\\\[(.*?)\\\]/g, '$1')
          .replace(/\\\((.*?)\\\)/g, '$1');
      } else if (formula.includes('=') || formula.includes('+') || formula.includes('-') || 
                 formula.includes('*') || formula.includes('/') || formula.includes('^')) {
        processedFormula = convertToLatex(formula);
      }
      
      const rendered = katex.renderToString(processedFormula, {
        throwOnError: false,
        displayMode: block,
        output: 'html'
      });
      setHtml(rendered);
      setError(false);
    } catch (err) {
      console.error('KaTeX error:', err);
      setError(true);
      setHtml(formula);
    }
  }, [formula, block]);

  if (error) {
    return (
      <span className="font-mono text-white bg-white/20 px-3 py-2 rounded-lg">
        {formula}
      </span>
    );
  }

  return (
    <span 
      dangerouslySetInnerHTML={{ __html: html }} 
      className={`${block ? 'block text-center my-4 text-2xl' : 'inline-block'} text-white`}
      style={{ filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))' }}
    />
  );
};

// Convert plain text to LaTeX
const convertToLatex = (text: string): string => {
  let latex = text;
  
  latex = latex.replace(/\^([0-9]+)/g, '^{$1}');
  latex = latex.replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}');
  latex = latex.replace(/\*/g, ' \\cdot ');
  latex = latex.replace(/\+-/g, '\\pm');
  latex = latex.replace(/([a-zA-Z])_([0-9]+)/g, '$1_{$2}');
  latex = latex.replace(/\bpi\b/g, '\\pi');
  latex = latex.replace(/\btheta\b/g, '\\theta');
  latex = latex.replace(/\balpha\b/g, '\\alpha');
  latex = latex.replace(/\bbeta\b/g, '\\beta');
  latex = latex.replace(/\bsum\b/g, '\\sum');
  latex = latex.replace(/\bint\b/g, '\\int');
  latex = latex.replace(/\bsin\b/g, '\\sin');
  latex = latex.replace(/\bcos\b/g, '\\cos');
  latex = latex.replace(/\btan\b/g, '\\tan');
  latex = latex.replace(/(\w+)\/(\w+)/g, '\\frac{$1}{$2}');
  
  return latex;
};

// Enhanced Formula Card Component
const FormulaCard = ({ formula, index }: { formula: string, index: number }) => {
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
            {copied ? (
              <CheckCircle className="w-5 h-5 text-green-300" />
            ) : (
              <Copy className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        
        <div className="bg-black/30 rounded-xl p-6 backdrop-blur">
          <MathFormula formula={formula} block={true} />
        </div>
        
        {expanded && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg fade-in">
            <p className="text-white/80 text-sm">Raw formula:</p>
            <code className="text-white/90 text-xs bg-black/30 p-2 rounded block mt-2">
              {formula}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Solved Example Component
const SolvedExample = ({ example, index }: { example: string, index: number }) => {
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
  
  return (
    <div 
      className="gradient-border rounded-2xl overflow-hidden hover-lift fade-in"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
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
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Star className={`w-5 h-5 ${liked ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
            </button>
            {expanded ? <ChevronUp className="w-6 h-6 text-white" /> : <ChevronDown className="w-6 h-6 text-white" />}
          </div>
        </button>
        
        {expanded && (
          <div className="px-6 pb-6 slide-in">
            <div className="bg-black/30 rounded-2xl p-6 backdrop-blur">
              <div className="mb-6">
                <h5 className="text-purple-300 font-bold mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Problem
                </h5>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border-l-4 border-purple-500">
                  <MathFormula formula={problem} block={true} />
                </div>
              </div>
              
              <div>
                <h5 className="text-blue-300 font-bold mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Step-by-Step Solution
                </h5>
                <div className="space-y-3">
                  {steps.map((step, stepIndex) => (
                    <div 
                      key={stepIndex} 
                      className="flex items-start stagger-animation"
                      style={{ animationDelay: `${stepIndex * 0.1}s` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0 mt-1">
                        {stepIndex + 1}
                      </div>
                      <div className="flex-1 bg-white/5 rounded-lg p-3">
                        {step.includes('=') || step.includes('+') || step.includes('-') ? (
                          <MathFormula formula={step} block={false} />
                        ) : (
                          <p className="text-gray-200">{step}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ value, max, label }: { value: number, max: number, label: string }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-bold">{value}/{max}</span>
      </div>
      <div className="h-3 bg-black/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  
  const topicId = params.topicId as string;
  
  const [summaryData, setSummaryData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (topicId) {
      fetchAISummary();
    }
  }, [topicId]);

  useEffect(() => {
    // Simulate progress
    if (summaryData) {
      const timer = setTimeout(() => {
        setProgress(Math.min(progress + 10, 100));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, summaryData]);

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
    
    const content = `
${summaryData.topic_name} - AI Study Guide
=====================================
Generated: ${new Date(summaryData.generated_at).toLocaleString()}

${summaryData.overview}

KEY CONCEPTS:
${summaryData.key_concepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

FORMULAS:
${summaryData.formulas.map((f, i) => `${i + 1}. ${f}`).join('\n')}

EXAMPLES:
${summaryData.solved_examples.join('\n\n')}

IMPORTANT QUESTIONS:
${summaryData.important_questions.map((q, i) => `Q${i + 1}. ${q}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summaryData.topic_name.replace(/\s+/g, '_')}_Study_Guide.txt`;
    a.click();
  };

  const sections = [
    { id: 'overview', title: 'Overview', icon: <Rocket className="w-5 h-5" />, color: 'from-blue-500 to-purple-500' },
    { id: 'concepts', title: 'Key Concepts', icon: <Brain className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
    { id: 'formulas', title: 'Formulas', icon: <Calculator className="w-5 h-5" />, color: 'from-green-500 to-teal-500' },
    { id: 'examples', title: 'Examples', icon: <Code className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
    { id: 'questions', title: 'Questions', icon: <Target className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500' },
    { id: 'mistakes', title: 'Mistakes', icon: <AlertCircle className="w-5 h-5" />, color: 'from-red-500 to-pink-500' },
    { id: 'tips', title: 'Tips', icon: <Lightbulb className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
    { id: 'revision', title: 'Revision', icon: <Zap className="w-5 h-5" />, color: 'from-teal-500 to-green-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="text-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-16 h-16 text-white" />
            </div>
          </div>
          <p className="mt-6 text-white text-xl font-bold neon-text">Generating AI Summary...</p>
          <p className="text-purple-300 mt-2">Preparing your personalized study guide</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="glass-effect rounded-3xl p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-300 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              Go Back
            </button>
            <button
              onClick={() => fetchAISummary()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition"
            >
              Try Again
            </button>
          </div>
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
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-96 h-96 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
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

        {/* Navigation Tabs */}
        <div className="glass-effect border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-1 overflow-x-auto py-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r ' + section.color + ' text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                Your Progress
              </h3>
              <div className="space-y-4">
                <ProgressBar value={progress} max={100} label="Overall Completion" />
                <ProgressBar value={summaryData?.key_concepts?.length || 0} max={10} label="Concepts Loaded" />
                <ProgressBar value={summaryData?.formulas?.length || 0} max={10} label="Formulas Ready" />
                <ProgressBar value={summaryData?.solved_examples?.length || 0} max={5} label="Examples Available" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-400" />
                Content Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-3xl font-bold text-blue-400">{summaryData?.formulas?.length || 0}</p>
                  <p className="text-xs text-gray-300 mt-1">Formulas</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-3xl font-bold text-green-400">{summaryData?.solved_examples?.length || 0}</p>
                  <p className="text-xs text-gray-300 mt-1">Examples</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-3xl font-bold text-purple-400">{summaryData?.important_questions?.length || 0}</p>
                  <p className="text-xs text-gray-300 mt-1">Questions</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-3xl font-bold text-orange-400">{summaryData?.tips_and_tricks?.length || 0}</p>
                  <p className="text-xs text-gray-300 mt-1">Tips</p>
                </div>
              </div>
            </div>

            {/* Study Timer */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-400" />
                Study Streak
              </h3>
              <div className="text-center">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                  7
                </p>
                <p className="text-gray-300 mt-2">Days in a row! 🔥</p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="glass-effect rounded-2xl p-6 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Rocket className="w-6 h-6 mr-3 text-blue-400" />
                  Topic Overview
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                    {summaryData?.overview}
                  </p>
                </div>
              </div>
            )}

            {/* Key Concepts */}
            {activeSection === 'concepts' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Brain className="w-6 h-6 mr-3 text-purple-400" />
                  Key Concepts to Master
                </h2>
                {summaryData?.key_concepts.map((concept, index) => (
                  <div 
                    key={index} 
                    className="glass-effect rounded-xl p-5 hover-lift stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
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

            {/* Formulas Section */}
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

            {/* Solved Examples */}
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

            {/* Important Questions */}
            {activeSection === 'questions' && (
              <div className="space-y-4 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-3 text-indigo-400" />
                  Important Exam Questions
                </h2>
                {summaryData?.important_questions.map((question, index) => (
                  <div 
                    key={index}
                    className="glass-effect rounded-xl p-5 hover-lift stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">Q{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        {question.includes('=') || question.includes('x^') ? (
                          <MathFormula formula={question} block={false} />
                        ) : (
                          <p className="text-gray-200">{question}</p>
                        )}
                      </div>
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
                  <div 
                    key={index}
                    className="glass-effect rounded-xl p-5 border-l-4 border-red-500 hover-lift stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-200">{mistake}</p>
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
                  Pro Tips & Tricks
                </h2>
                {summaryData?.tips_and_tricks.map((tip, index) => (
                  <div 
                    key={index}
                    className="glass-effect rounded-xl p-5 border-l-4 border-yellow-500 hover-lift stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-200">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revision Notes */}
            {activeSection === 'revision' && (
              <div className="glass-effect rounded-2xl p-6 fade-in">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-teal-400" />
                  Quick Revision Notes
                </h2>
                <div className="bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-xl p-6">
                  <ul className="space-y-3">
                    {summaryData?.revision_notes.map((note, index) => (
                      <li 
                        key={index}
                        className="flex items-start stagger-animation"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-200">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}