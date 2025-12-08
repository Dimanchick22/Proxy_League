import React, { useState, useEffect, useRef } from 'react'
import websocketService from '../services/websocket'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from '../hooks/useTranslation'
import '../styles/chat.css'

const ChatBox = ({ roomId, title }) => {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    if (roomId) {
      websocketService.joinRoom(roomId)
    }

    const handleMessage = (message) => {
      if (!roomId || message.room_id === roomId) {
        setMessages((prev) => [...prev, message])
      }
    }

    const handleUserJoined = (data) => {
      if (!roomId || data.room_id === roomId) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            content: data.content || `${data.username} joined`,
            created_at: new Date().toISOString(),
          },
        ])
      }
    }

    const handleUserLeft = (data) => {
      if (!roomId || data.room_id === roomId) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            content: data.content || `${data.username} left`,
            created_at: new Date().toISOString(),
          },
        ])
      }
    }

    const handleTyping = (data) => {
      if ((!roomId || data.room_id === roomId) && data.user_id !== user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.username))

        // Auto-remove after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev)
            newSet.delete(data.username)
            return newSet
          })
        }, 3000)
      }
    }

    const handleStopTyping = (data) => {
      if ((!roomId || data.room_id === roomId) && data.user_id !== user?.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.username)
          return newSet
        })
      }
    }

    websocketService.on('message', handleMessage)
    websocketService.on('user_joined', handleUserJoined)
    websocketService.on('user_left', handleUserLeft)
    websocketService.on('typing', handleTyping)
    websocketService.on('stop_typing', handleStopTyping)

    return () => {
      websocketService.off('message', handleMessage)
      websocketService.off('user_joined', handleUserJoined)
      websocketService.off('user_left', handleUserLeft)
      websocketService.off('typing', handleTyping)
      websocketService.off('stop_typing', handleStopTyping)

      if (roomId) {
        websocketService.leaveRoom(roomId)
      }
    }
  }, [roomId, user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Используем scrollTop вместо scrollIntoView чтобы не скроллить всю страницу
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInputMessage(value)

    // Send typing indicator
    if (value.trim()) {
      websocketService.sendTyping(roomId)

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendStopTyping(roomId)
      }, 2000)
    } else {
      websocketService.sendStopTyping(roomId)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      websocketService.sendMessage(inputMessage, roomId)
      websocketService.sendStopTyping(roomId)
      setInputMessage('')

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const getMessageAvatar = (message) => {
    if (message.avatar) {
      return <img src={message.avatar} alt={message.username} className="message-avatar-img" />
    }
    const initial = message.username?.charAt(0).toUpperCase() || '?'
    return <div className="message-avatar-initial">{initial}</div>
  }

  const displayTitle = title || t('chat')

  return (
    <div className="chat-box">
      <div className="chat-box-header">
        <h3>{displayTitle}</h3>
        <span className="chat-status">
          <span className="online-dot"></span>
          {t('connected')}
        </span>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>{t('noMessages')}</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.type === 'system' ? 'system-message' : ''
            } ${message.user_id === user?.id ? 'own-message' : 'other-message'}`}
          >
            {message.type !== 'system' && (
              <>
                {message.user_id !== user?.id && (
                  <div className="message-avatar">
                    {getMessageAvatar(message)}
                  </div>
                )}

                <div className="message-bubble">
                  <div className="message-header">
                    <strong className="message-username">{message.username}</strong>
                    <span className="message-time">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>

                {message.user_id === user?.id && (
                  <div className="message-avatar own-avatar">
                    {getMessageAvatar(message)}
                  </div>
                )}
              </>
            )}

            {message.type === 'system' && (
              <div className="system-content">{message.content}</div>
            )}
          </div>
        ))}

        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <div className="typing-avatar">
              <div className="typing-avatar-initial">
                {Array.from(typingUsers)[0].charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={t('typeMessage')}
          maxLength={500}
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!inputMessage.trim()}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 10L18 2L10 18L9 11L2 10Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default ChatBox
