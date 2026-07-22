import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function OnlineUsers({ currentUser, onUserSelect }) {
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await api.get('/api/users/online')
        setOnlineUsers(response.data.filter(user => user.username !== currentUser))
      } catch (error) {
        console.error('Failed to fetch online users:', error)
      }
    }

    fetchOnlineUsers()
    const interval = setInterval(fetchOnlineUsers, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [currentUser])

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="online-users">
      <h3>Online Users ({onlineUsers.length})</h3>
      <div className="user-list">
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className="user-item"
            onClick={() => onUserSelect && onUserSelect(user.username)}
          >
            <div className="user-avatar">
              {getInitials(user.username)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
            </div>
            <div className="user-status"></div>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <div className="text-center" style={{ color: '#666', padding: '1rem' }}>
            No other users online
          </div>
        )}
      </div>
    </div>
  )
}
