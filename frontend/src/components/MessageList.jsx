import React, { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { CheckCheck, Play, Pause } from 'lucide-react'

// Voice Note Player component matching the reference image
const VoiceMessagePlayer = ({ duration = '0:29' }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="voice-note-card">
      <button 
        type="button" 
        className="play-pause-btn" 
        onClick={() => setIsPlaying(!isPlaying)}
        title={isPlaying ? 'Pause' : 'Play audio'}
      >
        {isPlaying ? <Pause size={14} fill="#ffffff" /> : <Play size={14} fill="#ffffff" />}
      </button>

      <div className="waveform-bars-wrapper">
        {[8, 14, 20, 10, 18, 24, 16, 12, 22, 18, 14, 20, 8, 16, 22, 12].map((height, i) => (
          <div
            key={i}
            className={`waveform-bar ${isPlaying ? 'playing' : ''}`}
            style={{ 
              height: `${height}px`,
              animationDelay: `${(i % 5) * 0.15}s` 
            }}
          />
        ))}
      </div>

      <span className="voice-duration">{duration}</span>
    </div>
  )
}

export default function MessageList({ items, currentUser }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items])

  const formatTime = (timestamp) => {
    if (!timestamp) return dayjs().format('HH:mm')
    return dayjs(timestamp).format('HH:mm')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="message-feed-scroll">
      {/* Date badge as seen in modern apps */}
      {items.length > 0 && <div className="date-separator">Today</div>}

      {items.map((m, idx) => {
        const isMine = m.sender === currentUser
        const isSystem = m.messageType === 'JOIN' || m.messageType === 'LEAVE'
        const isVoiceNote = typeof m.content === 'string' && m.content.startsWith('[VOICE_NOTE:')

        if (isSystem) {
          return (
            <div key={idx} className="system-event-badge">
              <strong>{m.sender}</strong> {m.messageType === 'JOIN' ? 'joined the conversation' : 'left'}
            </div>
          )
        }

        const voiceDuration = isVoiceNote 
          ? `0:${m.content.replace('[VOICE_NOTE:', '').replace(']', '').padStart(2, '0')}`
          : '0:29'

        return (
          <div key={idx} className={`message-row ${isMine ? 'sent' : 'received'}`}>
            {/* Avatar for received message on the left */}
            {!isMine && (
              <div className="sender-avatar-received" title={m.sender}>
                {getInitials(m.sender)}
              </div>
            )}

            <div className="bubble-column">
              {isVoiceNote ? (
                <VoiceMessagePlayer duration={voiceDuration} />
              ) : (
                <div className="chat-bubble">
                  {m.content}
                </div>
              )}

              {/* Timestamp and delivery status */}
              <div className="message-timestamp-row">
                <span>{formatTime(m.timeStamp)}</span>
                {isMine && <CheckCheck size={14} className="check-icon-read" />}
              </div>
            </div>

            {/* Avatar for sent message: Neon Lime badge (like "SM" in screenshot) */}
            {isMine && (
              <div className="sender-avatar-lime" title={m.sender}>
                {getInitials(m.sender)}
              </div>
            )}
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="empty-chat-state">
          <div className="empty-chat-icon-box">💬</div>
          <p>No messages here yet. Say hello to start the conversation!</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
