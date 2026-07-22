import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(username, password)
    setLoading(false)
    if (res.ok) navigate('/')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              className="form-input"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              className="form-input"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
            />
          </div>
          {error && <div style={{ color: '#e74c3c', textAlign: 'center', marginTop: '1rem' }}>{String(error)}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-link">
          No account? <Link to="/register">Create one here</Link>
        </div>
        <div className="auth-note">
          <strong>Note:</strong> The backend uses HTTP-only cookies for security. 
          For local development, make sure your browser accepts cookies from localhost.
        </div>
      </div>
    </div>
  )
}
