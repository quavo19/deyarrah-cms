const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-blue-200 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="text-lg font-bold text-gray-900">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingOverlay
