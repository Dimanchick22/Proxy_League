import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import ChatBox from '../components/ChatBox'
import { useTranslation } from '../hooks/useTranslation'

const RoomDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoom()
  }, [id])

  const fetchRoom = async () => {
    try {
      const response = await roomAPI.getById(id)
      setRoom(response.data)
    } catch (error) {
      console.error('Failed to fetch room:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    try {
      await roomAPI.join({ room_id: parseInt(id) })
      fetchRoom()
    } catch (error) {
      console.error('Failed to join room:', error)
      alert(error.response?.data?.error || t('failedToJoin'))
    }
  }

  const handleLeave = async () => {
    try {
      await roomAPI.leave(id)
      navigate('/rooms')
    } catch (error) {
      console.error('Failed to leave room:', error)
      alert(error.response?.data?.error || 'Failed to leave room')
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      waiting: 'badge-warning',
      ready: 'badge-success',
      in_game: 'badge-info',
      completed: 'badge-success',
    }
    return statusMap[status] || 'badge-default'
  }

  const isUserParticipant = () => {
    return room?.participants?.some(p => p.id === user?.id)
  }

  const isUserHost = () => {
    return room?.host?.id === user?.id
  }

  const canJoinRoom = () => {
    return room?.status === 'waiting' &&
           !isUserParticipant() &&
           room.participants?.length < room.max_players
  }

  if (loading) {
    return <div className="loading">{t('loading')}</div>
  }

  if (!room) {
    return (
      <div className="error-container">
        <div className="error-icon">🎲</div>
        <h2 className="error-title">{t('roomNotFound')}</h2>
        <button onClick={() => navigate('/rooms')} className="btn-primary">
          {t('rooms')}
        </button>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-container">
        {/* Основной контент */}
        <div className="detail-main">
          {/* Заголовок */}
          <div className="detail-header">
            <div className="detail-header-content">
              <button onClick={() => navigate('/rooms')} className="back-button">
                ← {t('rooms')}
              </button>
              <h1 className="detail-title">{room.name}</h1>
              <p className="detail-description">
                {room.description || t('noDescriptionProvided')}
              </p>
            </div>

            <div className="detail-badges">
              <span className={`badge ${getStatusBadgeClass(room.status)}`}>
                {t(room.status)}
              </span>
              <span className="badge badge-info">
                <span className="badge-icon">👥</span>
                {room.participants?.length || 0}/{room.max_players}
              </span>
              {room.is_private && (
                <span className="badge badge-warning">
                  <span className="badge-icon">🔒</span>
                  {t('private')}
                </span>
              )}
            </div>

            <div className="action-buttons">
              {canJoinRoom() && (
                <button onClick={handleJoin} className="btn-primary btn-large">
                  <span>🎮</span>
                  {t('joinRoom')}
                </button>
              )}

              {isUserParticipant() && !isUserHost() && (
                <button onClick={handleLeave} className="btn-danger btn-large">
                  <span>🚪</span>
                  {t('leave')}
                </button>
              )}

              {isUserHost() && (
                <div className="host-badge">
                  <span className="badge-icon">👑</span>
                  {t('host')}
                </div>
              )}
            </div>
          </div>

          {/* Информация о комнате */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <div className="info-label">{t('host')}</div>
                <div className="info-value">{room.host?.username || t('toBeDetermined')}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📊</div>
              <div className="info-content">
                <div className="info-label">{t('status')}</div>
                <div className="info-value">{t(room.status)}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">👥</div>
              <div className="info-content">
                <div className="info-label">{t('capacity')}</div>
                <div className="info-value">
                  {room.participants?.length || 0}/{room.max_players}
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">{room.is_private ? '🔒' : '🌐'}</div>
              <div className="info-content">
                <div className="info-label">{t('type')}</div>
                <div className="info-value">
                  {room.is_private ? t('private') : t('public')}
                </div>
              </div>
            </div>
          </div>

          {/* Участники */}
          <div className="detail-section">
            <div className="section-header">
              <h2>
                <span className="section-icon">👥</span>
                {t('participants')}
              </h2>
              <span className="section-count">
                {room.participants?.length || 0}
              </span>
            </div>

            {room.participants && room.participants.length > 0 ? (
              <div className="participants-grid">
                {room.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`participant-card ${participant.id === room.host?.id ? 'is-host' : ''}`}
                  >
                    {participant.id === room.host?.id && (
                      <div className="participant-crown">👑</div>
                    )}
                    <div className="participant-rank">#{index + 1}</div>
                    <div className="participant-avatar">
                      {participant.avatar ? (
                        <img src={participant.avatar} alt={participant.username} />
                      ) : (
                        <div className="participant-initial">
                          {participant.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">
                        {participant.username}
                        {participant.id === room.host?.id && (
                          <span className="host-label">{t('host')}</span>
                        )}
                      </div>
                      <div className="participant-rating">
                        <span className="rating-icon">⭐</span>
                        {participant.rating || 1000}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section">
                <div className="empty-icon">👥</div>
                <p>{t('noParticipants')}</p>
              </div>
            )}
          </div>

          {/* Дополнительная информация */}
          {room.status !== 'waiting' && room.status !== 'ready' && (
            <div className="detail-section">
              <div className="section-header">
                <h2>
                  <span className="section-icon">📋</span>
                  {t('roomInformation')}
                </h2>
              </div>

              <div className="room-status-info">
                {room.status === 'in_game' && (
                  <div className="status-message in-progress">
                    <div className="status-icon">🎮</div>
                    <div className="status-text">
                      <h3>{t('in_game')}</h3>
                      <p>{t('matchInProgress')}</p>
                    </div>
                  </div>
                )}

                {room.status === 'completed' && (
                  <div className="status-message completed">
                    <div className="status-icon">✅</div>
                    <div className="status-text">
                      <h3>{t('completed')}</h3>
                      <p>{t('roomCompleted')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Чат */}
        <div className="detail-sidebar">
          <ChatBox roomId={parseInt(id)} title={t('roomChat')} />
        </div>
      </div>
    </div>
  )
}

export default RoomDetail
