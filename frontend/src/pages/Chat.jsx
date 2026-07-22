import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import dayjs from 'dayjs'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../api/axios'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import OnlineUsers from '../components/OnlineUsers'
import api from '../api/axios'

const MESSAGE_TYPE = {
  CHAT: 'CHAT',
  PRIVATE_MESSAGE: 'PRIVATE_MESSAGE',
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  TYPING: 'TYPING'
}

export default function Chat() {
  const { user } = useAuth()
  const [connected, setConnected] = useState(false)
  const [publicMessages, setPublicMessages] = useState([])
  const [privateMessages, setPrivateMessages] = useState([])
  const [receiver, setReceiver] = useState('')
  const clientRef = useRef(null)

  const privateQueueDestination = useMemo(() => `/user/${user?.username}/queue/private`, [user?.username])

  // Load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const publicResponse = await api.get('/api/messages/public')
        setPublicMessages(publicResponse.data)
      } catch (error) {
        console.error('Failed to load initial messages:', error)
      }
    }

    if (user?.username) {
      loadInitialMessages()
    }
  }, [user?.username])

  useEffect(() => {
    if (!user?.username) return
    
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP]', str)
    })
    client.onConnect = () => {
      setConnected(true)
      // Subscribe public
      client.subscribe('/topic/public', (message) => {
        try {
          const payload = JSON.parse(message.body)
          setPublicMessages((prev) => [...prev, payload])
        } catch {}
      })
      // Subscribe private
      client.subscribe(privateQueueDestination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          setPrivateMessages((prev) => [...prev, payload])
        } catch {}
      })
      // Send JOIN
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
      try { client.deactivate() } catch {}
    }
  }, [privateQueueDestination, user?.username])

  const sendPublic = (text) => {
    if (!clientRef.current || !connected) return
    clientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        sender: user?.username,
        content: text,
        messageType: MESSAGE_TYPE.CHAT,
        timeStamp: dayjs().format('YYYY-MM-DDTHH:mm:ss')
      })
    })
  }

  const sendPrivate = (text) => {
    if (!clientRef.current || !connected || !receiver) return
    clientRef.current.publish({
      destination: '/app/chat.sendPrivateMessage',
      body: JSON.stringify({
        sender: user?.username,
        receiver,
        content: text,
        messageType: MESSAGE_TYPE.PRIVATE_MESSAGE,
        timeStamp: dayjs().format('YYYY-MM-DDTHH:mm:ss')
      })
    })
  }

  const handleUserSelect = (username) => {
    setReceiver(username)
    // Load private messages with this user
    loadPrivateMessages(username)
  }

  const loadPrivateMessages = async (username) => {
    try {
      const response = await api.get(`/api/messages/private?user1=${user?.username}&user2=${username}`)
      setPrivateMessages(response.data)
    } catch (error) {
      console.error('Failed to load private messages:', error)
    }
  }

  return (
    <div className="chat-container">
      <h2 className="chat-title">RealTime Chat</h2>
      <div className="chat-grid">
        <OnlineUsers 
          currentUser={user?.username} 
          onUserSelect={handleUserSelect} 
        />
        
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Public Room</h3>
            <span className="connection-status">
              {connected ? '🟢' : '🔴'}
            </span>
          </div>
          <MessageList items={publicMessages} currentUser={user?.username} />
          <MessageInput onSend={sendPublic} placeholder="Send a public message..." />
        </div>
        
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Private Chat</h3>
            {receiver && <span style={{ fontSize: '0.9rem', color: '#666' }}>with @{receiver}</span>}
          </div>
          <div className="private-chat-receiver">
            <label>Send private message to:</label>
            <input 
              className="receiver-input"
              value={receiver} 
              onChange={(e) => setReceiver(e.target.value)}
              onBlur={() => receiver && loadPrivateMessages(receiver)}
              placeholder="Enter username" 
            />
          </div>
          <MessageList items={privateMessages} currentUser={user?.username} />
          <MessageInput 
            onSend={sendPrivate} 
            placeholder={receiver ? `Message @${receiver}...` : 'Select a user to start chatting'} 
            disabled={!receiver} 
          />
        </div>
      </div>
    </div>
  )
}
