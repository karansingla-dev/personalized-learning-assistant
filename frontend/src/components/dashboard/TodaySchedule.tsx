'use client';

interface TodayScheduleProps {
  schedule: {
    slots: Array<{
      time: string;
      subject: string;
      topic: string;
      type: string;
    }>;
  };
}

export default function TodaySchedule({ schedule }: TodayScheduleProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
      <div className="space-y-3">
        {schedule.slots.map((slot, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0 w-20">
              <span className="text-sm text-gray-500">{slot.time}</span>
            </div>
            <div className="flex-1 ml-4">
              <p className="font-medium text-gray-900">{slot.subject}</p>
              <p className="text-sm text-gray-600">{slot.topic}</p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                slot.type === 'learn' ? 'bg-blue-100 text-blue-700' :
                slot.type === 'practice' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {slot.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}