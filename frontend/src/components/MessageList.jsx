import React, { useEffect, useRef } from 'react'
import dayjs from 'dayjs'

export default function MessageList({ items, currentUser }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [items])

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return dayjs(timestamp).format('HH:mm')
  }

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="message-list">
      {items.map((m, idx) => {
        const isMine = m.sender === currentUser
        return (
          <div key={idx} className={`message-item ${isMine ? 'own' : ''}`}>
            {!isMine && (
              <div className="user-avatar" style={{ marginRight: '0.75rem', width: '32px', height: '32px', fontSize: '0.9rem' }}>
                {getInitials(m.sender)}
              </div>
            )}
            <div className={`message-bubble ${isMine ? 'own' : 'other'}`}>
              <div className="message-header">
                <strong>{m.sender}</strong>
                {m.messageType && m.messageType !== 'CHAT' && (
                  <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                    · {m.messageType}
                  </span>
                )}
              </div>
              <div className="message-content">{m.content}</div>
              <div className="message-time">{formatTime(m.timeStamp)}</div>
            </div>
            {isMine && (
              <div className="user-avatar" style={{ marginLeft: '0.75rem', width: '32px', height: '32px', fontSize: '0.9rem' }}>
                {getInitials(m.sender)}
              </div>
            )}
          </div>
        )
      })}
      {items.length === 0 && (
        <div className="text-center" style={{ color: '#666', padding: '2rem' }}>
          No messages yet. Start the conversation!
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
