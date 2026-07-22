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
      setError(e.response?.data || 'Login failed')
      return { ok: false, error: e }
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
      setError(e.response?.data || 'Registration failed')
      return { ok: false, error: e }
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
