import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import dayjs from 'dayjs'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../api/axios'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import OnlineUsers from '../components/OnlineUsers'
import api from '../api/axios'
import { 
  Phone, 
  Video, 
  ChevronLeft, 
  LogOut, 
  Hash, 
  PhoneOff, 
  Sparkles,
  Users
} from 'lucide-react'

const MESSAGE_TYPE = {
  CHAT: 'CHAT',
  PRIVATE_MESSAGE: 'PRIVATE_MESSAGE',
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  TYPING: 'TYPING'
}

export default function Chat() {
  const { user, logout } = useAuth()
  const [connected, setConnected] = useState(false)
  const [publicMessages, setPublicMessages] = useState([])
  const [privateMessages, setPrivateMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  
  // activeChat: 'PUBLIC' or username string
  const [activeChat, setActiveChat] = useState('PUBLIC')
  
  // Mobile drawer state: 'sidebar' or 'chat'
  const [mobileView, setMobileView] = useState('chat')
  
  // Simulated call modal: null | { type: 'voice' | 'video', target: string }
  const [activeCall, setActiveCall] = useState(null)

  const clientRef = useRef(null)
  const privateQueueDestination = useMemo(() => `/user/${user?.username}/queue/private`, [user?.username])

  // Function to fetch online users from API
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/users/online')
      if (res.data) {
        // Filter out current user
        setOnlineUsers(res.data.filter(u => u.username !== user?.username))
      }
    } catch (err) {
      console.error('Failed to fetch online users:', err)
    }
  }, [user?.username])

  // Periodic poll of online users as fallback
  useEffect(() => {
    fetchOnlineUsers()
    const interval = setInterval(fetchOnlineUsers, 8000)
    return () => clearInterval(interval)
  }, [fetchOnlineUsers])

  // Load initial public messages
  useEffect(() => {
    const loadInitialPublicMessages = async () => {
      try {
        const res = await api.get('/api/messages/public')
        setPublicMessages(res.data)
      } catch (error) {
        console.error('Failed to load initial public messages:', error)
      }
    }

    if (user?.username) {
      loadInitialPublicMessages()
    }
  }, [user?.username])

  // Load private messages when switching to a direct message chat
  useEffect(() => {
    if (activeChat && activeChat !== 'PUBLIC' && user?.username) {
      const loadPrivate = async () => {
        try {
          const res = await api.get(`/api/messages/private?user1=${user.username}&user2=${activeChat}`)
          setPrivateMessages(res.data)
        } catch (err) {
          console.error('Failed to load private messages:', err)
        }
      }
      loadPrivate()
    }
  }, [activeChat, user?.username])

  // WebSocket / STOMP setup
  useEffect(() => {
    if (!user?.username) return
    
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP]', str)
    })

    client.onConnect = () => {
      setConnected(true)

      // Subscribe to public messages & presence events
      client.subscribe('/topic/public', (message) => {
        try {
          const payload = JSON.parse(message.body)
          if (payload.messageType === MESSAGE_TYPE.JOIN) {
            // Update real-time presence
            if (payload.sender && payload.sender !== user.username) {
              setOnlineUsers((prev) => {
                if (prev.some(u => u.username === payload.sender)) return prev
                return [...prev, { id: payload.sender, username: payload.sender }]
              })
            }
          } else if (payload.messageType === MESSAGE_TYPE.LEAVE) {
            if (payload.sender) {
              setOnlineUsers((prev) => prev.filter(u => u.username !== payload.sender))
            }
          }

          setPublicMessages((prev) => [...prev, payload])
        } catch (err) {}
      })

      // Subscribe to private messages queue
      client.subscribe(privateQueueDestination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          setPrivateMessages((prev) => [...prev, payload])
        } catch (err) {}
      })

      // Send JOIN notification
      client.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify({
          sender: user?.username,
          content: '',
          messageType: MESSAGE_TYPE.JOIN,
          timeStamp: dayjs().format('YYYY-MM-DDTHH:mm:ss')
        })
      })
    }

    client.onStompError = () => setConnected(false)
    client.onWebSocketClose = () => setConnected(false)
    client.activate()
    clientRef.current = client

    return () => {
      try { 
        client.deactivate() 
      } catch {}
    }
  }, [privateQueueDestination, user?.username])

  // Send message handler (routes to public or private depending on activeChat)
  const handleSendMessage = (text) => {
    if (!clientRef.current || !connected) return

    if (activeChat === 'PUBLIC') {
      clientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify({
          sender: user?.username,
          content: text,
          messageType: MESSAGE_TYPE.CHAT,
          timeStamp: dayjs().format('YYYY-MM-DDTHH:mm:ss')
        })
      })
    } else {
      clientRef.current.publish({
        destination: '/app/chat.sendPrivateMessage',
        body: JSON.stringify({
          sender: user?.username,
          receiver: activeChat,
          content: text,
          messageType: MESSAGE_TYPE.PRIVATE_MESSAGE,
          timeStamp: dayjs().format('YYYY-MM-DDTHH:mm:ss')
        })
      })
    }
  }

  const handleSelectUser = (username) => {
    setActiveChat(username)
    setMobileView('chat')
  }

  const handleSelectPublic = () => {
    setActiveChat('PUBLIC')
    setMobileView('chat')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const activeMessages = activeChat === 'PUBLIC' ? publicMessages : privateMessages
  const activeTitle = activeChat === 'PUBLIC' ? 'Public Lounge' : activeChat
  const isDirectChat = activeChat !== 'PUBLIC'

  // Is current direct chat contact online?
  const isSelectedContactOnline = useMemo(() => {
    if (!isDirectChat) return false
    return onlineUsers.some(u => u.username === activeChat)
  }, [isDirectChat, onlineUsers, activeChat])

  // Count of total people online in Public Lounge (online users + current logged in user)
  const publicLoungeOnlineCount = useMemo(() => {
    return onlineUsers.length + (user ? 1 : 0)
  }, [onlineUsers.length, user])

  return (
    <div className="app-workspace">
      {/* Left Sidebar */}
      <aside className={`chat-sidebar ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="brand-name">Pulse</div>
            </div>
          </div>
          <span className="brand-tag">
            {connected ? 'LIVE' : 'CONNECTING'}
          </span>
        </div>

        {/* Current User Profile strip */}
        <div className="user-profile-strip">
          <div className="user-profile-info">
            <div className="user-avatar-sm-lime">
              {getInitials(user?.username)}
            </div>
            <div className="user-details-text">
              <span className="user-name-title">{user?.username}</span>
              <span className="user-status-text">
                <span className="user-status-dot-active" />
                Online
              </span>
            </div>
          </div>

          <button 
            type="button"
            className="logout-icon-btn" 
            onClick={logout} 
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Scrollable Channels & Contacts */}
        <div className="sidebar-scroll-area">
          <div className="section-label">Channels</div>
          
          <div 
            className={`channel-card ${activeChat === 'PUBLIC' ? 'active' : ''}`}
            onClick={handleSelectPublic}
          >
            <div className="contact-card-left">
              <div className="channel-avatar">
                <Hash size={20} />
              </div>
              <div className="contact-info-col">
                <span className="contact-name-row">Public Lounge</span>
                <span className="contact-status-sub">
                  {publicLoungeOnlineCount} {publicLoungeOnlineCount === 1 ? 'member' : 'members'} online
                </span>
              </div>
            </div>
            {/* Show how many people are online in Public Lounge */}
            <span className="unread-badge-pill">
              {publicLoungeOnlineCount} online
            </span>
          </div>

          {/* Direct message contacts with accurate Online/Offline indicator */}
          <OnlineUsers 
            currentUser={user?.username} 
            selectedUser={activeChat}
            onlineUsers={onlineUsers}
            onUserSelect={handleSelectUser} 
          />
        </div>
      </aside>

      {/* Main Chat Stage */}
      <main className="chat-stage-wrapper mobile-full">
        {/* Top Header matching reference image */}
        <header className="chat-main-header">
          <div className="header-contact-details">
            {/* Mobile back button to show sidebar */}
            <button 
              type="button" 
              className="mobile-back-btn" 
              onClick={() => setMobileView('sidebar')}
              title="Back to contacts"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Avatar */}
            <div className="header-avatar">
              {isDirectChat ? getInitials(activeChat) : <Hash size={22} />}
            </div>

            {/* Name & Online Status Pill */}
            <div className="header-title-col">
              <h2 className="header-name">{activeTitle}</h2>
              
              {/* Header status pill */}
              {isDirectChat ? (
                isSelectedContactOnline ? (
                  <div className="online-pill-badge">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0d2906', display: 'inline-block' }} />
                    <span>Online</span>
                  </div>
                ) : (
                  <div className="offline-pill-badge">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                    <span>Offline</span>
                  </div>
                )
              ) : (
                <div className="online-pill-badge">
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0d2906', display: 'inline-block' }} />
                  <span>{publicLoungeOnlineCount} Online</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Phone, Video Call matching reference) */}
          <div className="header-action-buttons">
            <button 
              type="button"
              className="header-action-btn" 
              onClick={() => setActiveCall({ type: 'voice', target: activeTitle })}
              title="Start voice call"
            >
              <Phone size={19} />
            </button>
            <button 
              type="button"
              className="header-action-btn" 
              onClick={() => setActiveCall({ type: 'video', target: activeTitle })}
              title="Start video call"
            >
              <Video size={19} />
            </button>
          </div>
        </header>

        {/* Message Feed Stream */}
        <MessageList 
          items={activeMessages} 
          currentUser={user?.username} 
        />

        {/* Floating Pill Message Input matching reference */}
        <MessageInput 
          onSend={handleSendMessage} 
          placeholder={isDirectChat ? `Message @${activeChat}...` : "Type a message..."} 
          disabled={!connected} 
        />
      </main>

      {/* Call Preview Modal */}
      {activeCall && (
        <div className="call-modal-overlay">
          <div className="call-modal-card">
            <div className="call-modal-avatar">
              {getInitials(activeCall.target)}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {activeCall.target}
            </h3>
            <p style={{ color: '#d2f54a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d2f54a', display: 'inline-block', animation: 'limePulse 1.5s infinite' }} />
              Calling {activeCall.type === 'video' ? 'Video' : 'Audio'}...
            </p>

            <div className="call-modal-actions">
              <button 
                type="button"
                className="call-action-btn-danger" 
                onClick={() => setActiveCall(null)}
                title="End call"
              >
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
