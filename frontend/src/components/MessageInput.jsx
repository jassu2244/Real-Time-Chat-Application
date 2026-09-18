import React, { useState, useRef } from 'react'
import { Plus, Mic, Send, Image, Smile, FileText } from 'lucide-react'

// Optional subtle audio chime synthesis using Web Audio API for message sending
const playSendChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1) // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
  } catch (e) {
    // Ignore audio context errors if not allowed by browser autoplay policy
  }
}

export default function MessageInput({ onSend, placeholder = 'Type a message', disabled = false }) {
  const [text, setText] = useState('')
  const [showAttachments, setShowAttachments] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const recordIntervalRef = useRef(null)
  const textareaRef = useRef(null)

  const submit = (e) => {
    e?.preventDefault()
    if (!text.trim() || disabled) return
    onSend?.(text.trim())
    playSendChime()
    setText('')
    setShowAttachments(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and send voice simulated message
      clearInterval(recordIntervalRef.current)
      setIsRecording(false)
      const duration = recordSeconds > 0 ? recordSeconds : 15
      onSend?.(`[VOICE_NOTE:${duration}]`)
      playSendChime()
      setRecordSeconds(0)
    } else {
      setIsRecording(true)
      setRecordSeconds(0)
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1)
      }, 1000)
    }
  }

  const sendQuickAttachment = (type) => {
    setShowAttachments(false)
    if (type === 'image') {
      onSend?.('📷 Shared an image preview')
    } else if (type === 'file') {
      onSend?.('📄 Shared a document')
    } else if (type === 'emoji') {
      setText((prev) => prev + ' 👍')
    }
  }

  return (
    <div className="chat-input-bottom-bar">
      {showAttachments && (
        <div className="attachment-popover">
          <button type="button" className="attachment-item" onClick={() => sendQuickAttachment('image')}>
            <Image size={18} color="#0e4438" />
            <span>Send Image</span>
          </button>
          <button type="button" className="attachment-item" onClick={() => sendQuickAttachment('file')}>
            <FileText size={18} color="#0e4438" />
            <span>Send File</span>
          </button>
          <button type="button" className="attachment-item" onClick={() => sendQuickAttachment('emoji')}>
            <Smile size={18} color="#0e4438" />
            <span>Add Emoji</span>
          </button>
        </div>
      )}

      <div className="floating-pill-input-box">
        {/* Plus Attachment Button */}
        <button
          type="button"
          className="attachment-action-btn"
          onClick={() => setShowAttachments(!showAttachments)}
          title="Attach media or emoji"
        >
          <Plus size={20} />
        </button>

        {isRecording ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'limePulse 1s infinite' }} />
            <span>Recording voice note... 0:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}</span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="chat-text-area"
            rows={1}
          />
        )}

        {/* Voice Mic Button */}
        <button
          type="button"
          className={`voice-mic-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? 'Tap to finish & send voice' : 'Record voice note'}
        >
          <Mic size={20} />
        </button>
      </div>

      {/* Circular Green Send Button with Paper Airplane */}
      <button
        type="button"
        disabled={disabled || (!text.trim() && !isRecording)}
        onClick={isRecording ? toggleRecording : submit}
        className="send-plane-circle-btn"
        title="Send message"
      >
        <Send size={18} />
      </button>
    </div>
  )
}
