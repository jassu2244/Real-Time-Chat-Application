import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Lock, ArrowRight, MessageSquareCode, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [clientError, setClientError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleUsernameChange = (e) => {
    const val = e.target.value
    setUsername(val)
    if (clientError) setClientError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setClientError('')

    const trimmedUser = username.trim()
    if (trimmedUser.includes('@')) {
      setClientError('Please enter your valid username rather than your email address.')
      return
    }

    setLoading(true)
    const res = await login(trimmedUser, password)
    setLoading(false)
    if (res.ok) {
      navigate('/')
    }
  }

  const displayError = clientError || error

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
                onChange={handleUsernameChange} 
                placeholder="Enter your username"
                required 
                autoComplete="username"
              />
            </div>
            {username.includes('@') && (
              <span style={{ fontSize: '0.78rem', color: '#facc15', marginTop: '0.25rem', display: 'block' }}>
                Note: Enter your username, not your email address.
              </span>
            )}
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

          {displayError && (
            <div className="auth-error-banner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{typeof displayError === 'string' ? displayError : displayError?.message || 'Login failed. Please verify credentials.'}</span>
              </div>
              {typeof displayError === 'string' && displayError.toLowerCase().includes('sign up') && (
                <Link to="/register" style={{ color: '#d2f54a', textDecoration: 'underline', fontWeight: 600, fontSize: '0.85rem' }}>
                  Create an account now →
                </Link>
              )}
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
