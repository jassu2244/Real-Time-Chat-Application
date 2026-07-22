import React, { useState, useRef } from 'react'

export default function MessageInput({ onSend, placeholder = 'Type a message', disabled = false }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend?.(text.trim())
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(e)
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="message-input-container">
      <form onSubmit={submit}>
        <div className="message-input-row">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="message-input"
            rows={1}
          />
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="send-btn"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
