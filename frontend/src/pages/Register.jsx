import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function Register() {
  const { register, error } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clientError, setClientError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setClientError('')

    const trimmedUser = username.trim()
    if (trimmedUser.includes('@')) {
      setClientError("Username cannot contain '@'. Please pick a regular username.")
      return
    }

    setLoading(true)
    const res = await register(trimmedUser, email.trim(), password)
    setLoading(false)
    if (res.ok) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d2f54a', '#0e4438', '#ffffff']
        })
      } catch (err) {}
      navigate('/')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-glow-blob" style={{ top: '15%', right: '15%' }} />
      <div className="auth-glow-blob" style={{ bottom: '15%', left: '15%', opacity: 0.2 }} />

      <div className="auth-card-modern">
        <div className="auth-header">
          <div className="auth-badge">
            <Sparkles size={16} />
            <span>Join the Network</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Experience lightning fast real-time conversations</p>
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
                placeholder="Choose a handle (e.g. alex)"
                required 
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-field-group">
            <label className="input-label">Email</label>
            <div className="input-box-wrapper">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input 
                className="modern-input"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="alex@example.com"
                required 
                autoComplete="email"
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
                placeholder="Create a strong password"
                required 
                autoComplete="new-password"
              />
            </div>
          </div>

          {(clientError || error) && (
            <div className="auth-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{typeof (clientError || error) === 'string' ? (clientError || error) : (clientError || error)?.message || 'Registration failed. Please try again.'}</span>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Already registered? 
          <Link to="/login" className="auth-link-anchor">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
