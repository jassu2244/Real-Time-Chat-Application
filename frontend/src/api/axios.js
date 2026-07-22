import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

export default api
export { API_URL }
