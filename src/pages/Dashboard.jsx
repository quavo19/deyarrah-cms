import { useAuthContext } from '@/hooks/useAuthContext'

const Dashboard = () => {
  const { user } = useAuthContext()

  const getUserName = () => {
    if (!user) return 'User'
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.first_name) return user.first_name
    if (user.last_name) return user.last_name
    if (user.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {getUserName()}!
          </h1>
          <p className="text-gray-600">Dashboard content will go here.</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
