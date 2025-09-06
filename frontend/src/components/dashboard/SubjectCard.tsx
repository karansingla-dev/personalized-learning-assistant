'use client';

interface SubjectCardProps {
  subject: {
    subject_id: string;
    subject_name: string;
    icon: string;
    color: string;
    total_topics: number;
    completed_topics: number;
    progress_percentage: number;
    next_topic: string | null;
  };
  onClick: () => void;
}

export default function SubjectCard({ subject, onClick }: SubjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Color Bar */}
      <div 
        className="h-2" 
        style={{ backgroundColor: subject.color }}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{subject.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                {subject.subject_name}
              </h3>
              <p className="text-sm text-gray-500">
                {subject.completed_topics} / {subject.total_topics} topics
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(subject.progress_percentage)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${subject.progress_percentage}%`,
                backgroundColor: subject.color
              }}
            />
          </div>
        </div>

        {/* Next Topic */}
        {subject.next_topic && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Next: {subject.next_topic}</span>
          </div>
        )}

        {/* Hover Effect */}
        <div className="mt-4 flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition">
          <span className="text-sm font-medium">View Topics</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}