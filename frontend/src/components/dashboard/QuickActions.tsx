'use client';

import { useRouter } from 'next/navigation';

interface QuickActionsProps {
  actions: Array<{
    label: string;
    action: string;
    subject_id?: string;
    enabled?: boolean;
  }>;
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const router = useRouter();

  const handleAction = (action: any) => {
    switch (action.action) {
      case 'continue':
        if (action.subject_id) {
          router.push(`/subjects/${action.subject_id}`);
        }
        break;
      case 'quiz':
        router.push('/quiz');
        break;
      case 'schedule':
        router.push('/planner');
        break;
      case 'practice':
        router.push('/practice');
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action)}
            disabled={action.enabled === false}
            className={`p-4 rounded-lg border-2 transition-all ${
              action.enabled === false
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600'
            }`}
          >
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
