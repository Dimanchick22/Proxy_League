import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomAPI } from '../services/api'
import CreateRoomModal from '../components/CreateRoomModal'
import { useTranslation } from '../hooks/useTranslation'

const Rooms = () => {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchRooms()
  }, [filter])

  const fetchRooms = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await roomAPI.getAll(params)
      setRooms(response.data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ready': return 'badge-success'
      case 'in_game': return 'badge-warning'
      case 'waiting': return 'badge-info'
      case 'completed': return 'badge-muted'
      default: return ''
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return '✓'
      case 'in_game': return '🎮'
      case 'waiting': return '⏳'
      case 'completed': return '✔'
      default: return '•'
    }
  }

  const getRoomIcon = (isPrivate) => {
    return isPrivate ? '🔒' : '🌐'
  }

  if (loading) return <div className="loading">{t('loading')}</div>

  return (
    <div className="rooms-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-icon">🎮</div>
          <div>
            <h1>{t('rooms')}</h1>
            <p className="page-subtitle">{t('joinOrCreateRooms')}</p>
          </div>
        </div>
        <button className="btn-primary btn-large" onClick={() => setIsModalOpen(true)}>
          <span>+</span>
          {t('createRoom')}
        </button>
      </div>

      <div className="filter-tabs">
        {['all', 'waiting', 'ready', 'in_game'].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status !== 'all' && <span className="filter-icon">{getStatusIcon(status)}</span>}
            {t('filter' + status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''))}
          </button>
        ))}
      </div>

      <div className="content-grid">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>{t('noRooms')}</h3>
            <p>{t('joinOrCreateRooms')}</p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              + {t('createRoom')}
            </button>
          </div>
        ) : (
          rooms.map((room) => (
            <Link key={room.id} to={`/rooms/${room.id}`} className="content-card room-card">
              <div className="card-header">
                <div className="card-icon">{getRoomIcon(room.is_private)}</div>
                <div className="card-badges">
                  <span className={`badge ${getStatusBadgeClass(room.status)}`}>
                    <span className="badge-icon">{getStatusIcon(room.status)}</span>
                    {t(room.status)}
                  </span>
                  {room.is_private && (
                    <span className="badge badge-warning">
                      <span className="badge-icon">🔒</span>
                      {t('private')}
                    </span>
                  )}
                </div>
              </div>

              <div className="card-content">
                <h3 className="card-title">{room.name}</h3>
                <p className="card-description">
                  {room.description || t('noDescriptionProvided')}
                </p>
              </div>

              <div className="card-meta">
                <div className="meta-item">
                  <div className="meta-icon">👥</div>
                  <div className="meta-content">
                    <div className="meta-label">{t('players')}</div>
                    <div className="meta-value">
                      {room.participants?.length || 0}/{room.max_players}
                    </div>
                  </div>
                </div>

                <div className="meta-item">
                  <div className="meta-icon">👑</div>
                  <div className="meta-content">
                    <div className="meta-label">{t('host')}</div>
                    <div className="meta-value host-name">
                      {room.host?.username || t('toBeDetermined')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <div className="participant-avatars">
                  {room.participants && room.participants.length > 0 ? (
                    <>
                      {room.participants.slice(0, 3).map((participant, index) => (
                        <div key={participant.id} className="participant-avatar" style={{ zIndex: 10 - index }}>
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.username} />
                          ) : (
                            <div className="avatar-initial">{participant.username.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                      ))}
                      {room.participants.length > 3 && (
                        <div className="participant-more">+{room.participants.length - 3}</div>
                      )}
                    </>
                  ) : (
                    <span className="no-participants">{t('noParticipants')}</span>
                  )}
                </div>
                <div className="card-arrow">→</div>
              </div>
            </Link>
          ))
        )}
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRooms}
      />
    </div>
  )
}

export default Rooms
