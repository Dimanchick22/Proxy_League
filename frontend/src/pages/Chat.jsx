import React, { useEffect, useState, useRef } from 'react'
import websocketService from '../services/websocket'
import { useAuthStore } from '../stores/authStore'

const Chat = () => {
  const { user, token } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (token) {
      websocketService.connect(token)

      websocketService.on('message', handleMessage)
      websocketService.on('user_joined', handleUserJoined)
      websocketService.on('user_left', handleUserLeft)
    }

    return () => {
      websocketService.off('message', handleMessage)
      websocketService.off('user_joined', handleUserJoined)
      websocketService.off('user_left', handleUserLeft)
    }
  }, [token])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleMessage = (message) => {
    setMessages((prev) => [...prev, message])
  }

  const handleUserJoined = (data) => {
    setMessages((prev) => [
      ...prev,
      {
        type: 'system',
        content: `${data.username} joined the chat`,
        created_at: new Date().toISOString(),
      },
    ])
  }

  const handleUserLeft = (data) => {
    setMessages((prev) => [
      ...prev,
      {
        type: 'system',
        content: `${data.username} left the chat`,
        created_at: new Date().toISOString(),
      },
    ])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      websocketService.sendMessage(inputMessage)
      setInputMessage('')
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.type === 'system' ? 'system-message' : ''} ${
                message.user_id === user?.id ? 'own-message' : ''
              }`}
            >
              {message.type !== 'system' && (
                <div className="message-header">
                  <strong>{message.username}</strong>
                  <span className="message-time">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
          />
          <button type="submit" className="btn-primary">
            Send
          </button>
        </form>
      </div>

      <div className="chat-sidebar">
        <h3>Online Users</h3>
        <div className="online-users-list">
          {onlineUsers.map((onlineUser, index) => (
            <div key={index} className="online-user">
              <span className="online-indicator"></span>
              <span>{onlineUser.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Chat
