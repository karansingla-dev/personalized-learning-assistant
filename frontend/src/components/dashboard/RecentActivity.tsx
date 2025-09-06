'use client';

interface RecentActivityProps {
  activities: Array<{
    topic_name: string;
    subject_id: string;
    status: string;
    last_accessed: string;
    time_spent: number;
  }>;
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{activity.topic_name}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'in_progress' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-xs text-gray-500">
                  {formatDate(activity.last_accessed)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">
                {activity.time_spent} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}