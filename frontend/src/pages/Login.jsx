import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Lock, ArrowRight, MessageSquareCode } from 'lucide-react'

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
    if (res.ok) {
      navigate('/')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-glow-blob" style={{ top: '10%', left: '15%' }} />
      <div className="auth-glow-blob" style={{ bottom: '10%', right: '15%', opacity: 0.2 }} />

      <div className="auth-card-modern">
        <div className="auth-header">
          <div className="auth-badge">
            <MessageSquareCode size={16} />
            <span>Pulse Messenger</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to connect with your real-time rooms</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-modern">
          <div className="input-field-group">
            <label className="input-label">Username</label>
            <div className="input-box-wrapper">
              <span className="input-icon-left">
                <User size={18} />
              </span>
              <input 
                className="modern-input"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter your username"
                required 
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-field-group">
            <label className="input-label">Password</label>
            <div className="input-box-wrapper">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input 
                className="modern-input"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="auth-error-banner">
              {typeof error === 'string' ? error : error?.message || 'Login failed. Please verify credentials.'}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? 
          <Link to="/register" className="auth-link-anchor">Create one here</Link>
        </div>
      </div>
    </div>
  )
}
