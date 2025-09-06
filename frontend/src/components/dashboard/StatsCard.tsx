'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
}

export default function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`${color} bg-opacity-10 p-3 rounded-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}