// frontend/src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h2>
        <p className="text-gray-600">Setting up your personalized learning space</p>
      </div>
    </div>
  );
}