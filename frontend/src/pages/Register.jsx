import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, error } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await register(username, email, password)
    setLoading(false)
    if (res.ok) navigate('/')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Join the Chat</h2>
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
            <label>Email</label>
            <input 
              className="form-input"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="email"
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
              autoComplete="new-password"
            />
          </div>
          {error && <div style={{ color: '#e74c3c', textAlign: 'center', marginTop: '1rem' }}>{String(error)}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
