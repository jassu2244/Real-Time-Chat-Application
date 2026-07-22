import React from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import './styles/chat.css'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <nav className="navbar">
      <Link to="/">🏠 Home</Link>
      <div className="navbar-user">
        {user ? (
          <>
            <span>Signed in as <b>{user.username}</b></span>
            <button 
              className="logout-btn"
              onClick={async () => { await logout(); navigate('/login') }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
