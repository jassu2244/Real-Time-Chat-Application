import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isDbIssue =
      !error.response ||
      error.response.status === 503 ||
      error.response.data?.error === 'DATABASE_UNAVAILABLE' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      (typeof error.response?.data?.message === 'string' && error.response.data.message.toLowerCase().includes('database'))

    if (isDbIssue) {
      console.error('db instance not working:', error.response?.data?.message || error.message || 'Cannot reach database or backend service')
    }
    return Promise.reject(error)
  }
)

export default api
export { API_URL }
