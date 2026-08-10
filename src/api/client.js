import axios from 'axios'

const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // if (error.response?.status === 401 || error.response?.data?.error === 'Unauthorized' || error.response?.status === 500) {
    //   const token = localStorage.getItem('token')
    //   if (token) {
    //     localStorage.removeItem('token')
    //     const currentPath = window.location.pathname
    //     if (!currentPath.includes('/login') && !currentPath.includes('/signup') && !currentPath.includes('/otp')) {
    //       window.location.href = '/login'
    //     }
    //   }
    // }
    return Promise.reject(error)
  }
)

export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
}

export default apiClient
