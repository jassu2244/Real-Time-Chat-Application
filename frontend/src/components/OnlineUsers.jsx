import React, { useEffect, useState, useMemo } from 'react'
import api from '../api/axios'
import { Search } from 'lucide-react'

export default function OnlineUsers({ 
  currentUser, 
  selectedUser, 
  onUserSelect, 
  onlineUsers = [],
  onUsersLoaded
}) {
  const [allUsers, setAllUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await api.get('/api/users/all')
        if (res.data) {
          const filtered = res.data.filter(u => u.username !== currentUser)
          setAllUsers(filtered)
          onUsersLoaded?.(filtered)
        }
      } catch (err) {
        console.error('Failed to load all users:', err)
      }
    }

    fetchAllUsers()
  }, [currentUser, onUsersLoaded])

  const onlineUsernames = useMemo(() => {
    return new Set(onlineUsers.map(u => typeof u === 'string' ? u : u.username))
  }, [onlineUsers])

  // Combine and deduplicate users
  const displayedUsers = useMemo(() => {
    const map = new Map()
    allUsers.forEach(u => map.set(u.username, u))
    onlineUsers.forEach(u => {
      const uname = typeof u === 'string' ? u : u.username
      if (uname && uname !== currentUser && !map.has(uname)) {
        map.set(uname, { id: uname, username: uname })
      }
    })

    return Array.from(map.values()).filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
  }, [allUsers, onlineUsers, searchTerm, currentUser])

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <div className="sidebar-search-box">
        <div className="search-input-wrapper">
          <Search size={16} className="search-input-icon" />
          <input
            className="search-field"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="section-label">Direct Messages</div>

      {displayedUsers.map((u) => {
        const isOnline = onlineUsernames.has(u.username)
        const isSelected = selectedUser === u.username

        return (
          <div
            key={u.id || u.username}
            className={`contact-card ${isSelected ? 'active' : ''}`}
            onClick={() => onUserSelect && onUserSelect(u.username)}
          >
            <div className="contact-card-left">
              <div className="contact-avatar-wrapper">
                <div className="contact-avatar">
                  {getInitials(u.username)}
                </div>
                {/* Only show glowing green dot if online, else subtle grey */}
                {isOnline ? (
                  <div className="online-indicator-dot" />
                ) : (
                  <div className="offline-indicator-dot" />
                )}
              </div>
              <div className="contact-info-col">
                <span className="contact-name-row">{u.username}</span>
                <span className={`contact-status-sub ${isOnline ? 'status-online' : 'status-offline'}`}>
                  {isOnline ? 'Active now' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Only show 'online' badge when user is actually online */}
            {isOnline ? (
              <span className="unread-badge-pill">online</span>
            ) : (
              <span className="offline-badge-pill">offline</span>
            )}
          </div>
        )
      })}

      {displayedUsers.length === 0 && (
        <div style={{ color: '#8fa59d', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 1rem' }}>
          {searchTerm ? 'No users match search' : 'No other contacts registered'}
        </div>
      )}
    </>
  )
}
