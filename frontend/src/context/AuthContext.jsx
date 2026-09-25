import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/auth/getcurrentuser')
      setUser(res.data)
    } catch (e) {
      if (!e.response || e.response.status === 503) {
        console.error("db instance not working:", e.message || "DB unavailable")
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const login = async (username, password) => {
    setError(null)
    try {
      const res = await api.post('/api/auth/login', { username, password })
      // Backend sets httpOnly cookie; body contains user object
      setUser(res.data)
      return { ok: true }
    } catch (e) {
      const data = e.response?.data
      const status = e.response?.status
      const isDbDown =
        status === 503 ||
        data?.error === 'DATABASE_UNAVAILABLE' ||
        e.code === 'ERR_NETWORK' ||
        e.code === 'ECONNABORTED' ||
        !e.response

      if (isDbDown) {
        console.error("db instance not working:", e.message || data?.message || "DB connection failed")
      }

      let errorMsg = 'Login failed'
      if (data?.message) {
        errorMsg = data.message
      } else if (typeof data === 'string' && data.trim()) {
        errorMsg = data
      } else if (isDbDown) {
        errorMsg = 'Database instance not working or backend unreachable. Please try again later.'
      }

      setError(errorMsg)
      return { ok: false, error: errorMsg }
    }
  }

  const register = async (username, email, password) => {
    setError(null)
    try {
      await api.post('/api/auth/register-user', { username, email, password })
      // Auto login after register
      const loginRes = await login(username, password)
      return loginRes
    } catch (e) {
      const data = e.response?.data
      const isDbDown = e.response?.status === 503 || data?.error === 'DATABASE_UNAVAILABLE' || !e.response
      if (isDbDown) {
        console.error("db instance not working:", e.message || "DB connection failed")
      }
      let errorMsg = 'Registration failed'
      if (data?.message) {
        errorMsg = data.message
      } else if (typeof data === 'string' && data.trim()) {
        errorMsg = data
      } else if (isDbDown) {
        errorMsg = 'Database instance not working or backend unreachable. Please try again later.'
      }
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    }
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (e) {
      // ignore
    } finally {
      setUser(null)
    }
  }

  const value = useMemo(() => ({ user, loading, error, login, register, logout }), [user, loading, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
