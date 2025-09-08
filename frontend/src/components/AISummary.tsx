// frontend/src/components/AISummary.tsx
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  BookOpen, 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  ClipboardList,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Download
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
  full_content?: string;
  from_cache?: boolean;
}

interface AISummaryProps {
  topicId: string;
  topicName?: string;
}

export default function AISummary({ topicId, topicName }: AISummaryProps) {
  const [summaryData, setSummaryData] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'key_concepts', 'formulas']));
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchAISummary();
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
      console.error('Error fetching AI summary:', err);
      setError('Failed to load AI summary. Please try again later.');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await fetchAISummary(true);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const downloadSummary = () => {
    if (!summaryData) return;
    
    const content = `
${summaryData.topic_name} - Study Guide
Subject: ${summaryData.subject} | Class: ${summaryData.class_level}
Generated: ${new Date(summaryData.generated_at).toLocaleDateString()}

OVERVIEW
${summaryData.overview}

KEY CONCEPTS
${summaryData.key_concepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANT FORMULAS
${summaryData.formulas.map((f, i) => `${i + 1}. ${f}`).join('\n')}

IMPORTANT QUESTIONS
${summaryData.important_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

REVISION NOTES
${summaryData.revision_notes.map((n, i) => `• ${n}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summaryData.topic_name.replace(/\s+/g, '_')}_summary.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating AI summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => fetchAISummary()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summaryData) {
    return null;
  }

  const sections = [
    {
      id: 'overview',
      title: 'Topic Overview',
      icon: <BookOpen className="w-5 h-5" />,
      content: summaryData.overview,
      type: 'text'
    },
    {
      id: 'key_concepts',
      title: 'Key Concepts',
      icon: <Brain className="w-5 h-5" />,
      content: summaryData.key_concepts,
      type: 'list'
    },
    {
      id: 'formulas',
      title: 'Important Formulas',
      icon: <Calculator className="w-5 h-5" />,
      content: summaryData.formulas,
      type: 'formulas'
    },
    {
      id: 'solved_examples',
      title: 'Solved Examples',
      icon: <CheckCircle className="w-5 h-5" />,
      content: summaryData.solved_examples,
      type: 'examples'
    },
    {
      id: 'important_questions',
      title: 'Important Questions for Exams',
      icon: <ClipboardList className="w-5 h-5" />,
      content: summaryData.important_questions,
      type: 'questions'
    },
    {
      id: 'common_mistakes',
      title: 'Common Mistakes to Avoid',
      icon: <AlertCircle className="w-5 h-5" />,
      content: summaryData.common_mistakes,
      type: 'mistakes'
    },
    {
      id: 'tips_and_tricks',
      title: 'Tips & Tricks',
      icon: <Lightbulb className="w-5 h-5" />,
      content: summaryData.tips_and_tricks,
      type: 'tips'
    },
    {
      id: 'revision_notes',
      title: 'Quick Revision Notes',
      icon: <ClipboardList className="w-5 h-5" />,
      content: summaryData.revision_notes,
      type: 'revision'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Brain className="w-7 h-7 mr-3" />
              AI-Generated Study Guide
            </h2>
            <p className="text-blue-100">
              {summaryData.topic_name} • {summaryData.subject} • Class {summaryData.class_level}
            </p>
            <p className="text-sm text-blue-200 mt-2">
              {summaryData.from_cache ? '📁 From cache' : '✨ Freshly generated'} • 
              Updated: {new Date(summaryData.generated_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
            <button
              onClick={downloadSummary}
              className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center">
                <span className="text-blue-600 mr-3">{section.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                {section.content && Array.isArray(section.content) && (
                  <span className="ml-3 text-sm text-gray-500">
                    ({section.content.length} items)
                  </span>
                )}
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.has(section.id) && (
              <div className="px-6 pb-6 border-t border-gray-100">
                {section.type === 'text' && (
                  <div className="mt-4 prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content as string}
                    </p>
                  </div>
                )}

                {section.type === 'list' && (
                  <ul className="mt-4 space-y-3">
                    {(section.content as string[]).map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1">▸</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.type === 'formulas' && (
                  <div className="mt-4 space-y-3">
                    {(section.content as string[]).map((formula, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg font-mono text-sm flex items-center justify-between group"
                      >
                        <span>{formula}</span>
                        <button
                          onClick={() => copyToClipboard(formula)}
                          className="opacity-0 group-hover:opacity-100 transition"
                        >
                          <Copy className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'examples' && (
                  <div className="mt-4 space-y-4">
                    {(section.content as string[]).map((example, index) => (
                      <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="font-semibold text-blue-900 mb-2">Example {index + 1}</p>
                        <p className="text-gray-700">{example}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'questions' && (
                  <ol className="mt-4 space-y-3">
                    {(section.content as string[]).map((question, index) => (
                      <li key={index} className="flex items-start">
                        <span className="font-semibold text-blue-600 mr-3">{index + 1}.</span>
                        <span className="text-gray-700">{question}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {section.type === 'mistakes' && (
                  <div className="mt-4 space-y-3">
                    {(section.content as string[]).map((mistake, index) => (
                      <div key={index} className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{mistake}</span>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'tips' && (
                  <div className="mt-4 space-y-3">
                    {(section.content as string[]).map((tip, index) => (
                      <div key={index} className="flex items-start">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'revision' && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {(section.content as string[]).map((note, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}