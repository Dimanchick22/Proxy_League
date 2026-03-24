import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import CreateRoomModal from '../components/CreateRoomModal'
import { useTranslation } from '../hooks/useTranslation'

const Rooms = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [passwordModal, setPasswordModal] = useState({ open: false, roomId: null })
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [joiningRoomId, setJoiningRoomId] = useState(null)

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

  const handleDeleteRoom = async (e, roomId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(t('confirmDeleteRoom'))) return
    try {
      await roomAPI.delete(roomId)
      fetchRooms()
    } catch (error) {
      alert(error.response?.data?.error || t('failedToDelete'))
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

  const getRoomIcon = (isPrivate) => isPrivate ? '🔒' : '🌐'

  const handleRoomClick = async (e, room) => {
    e.preventDefault()
    const isAlreadyParticipant = room.participants?.some(p => p.id === user?.id)
    const isFull = room.participants?.length >= room.max_players
    const isWaiting = room.status === 'waiting'

    // If already a participant or room is not joinable, just navigate
    if (isAlreadyParticipant || !isWaiting || isFull) {
      navigate(`/rooms/${room.id}`)
      return
    }

    // Private room — show password prompt
    if (room.is_private) {
      setPasswordModal({ open: true, roomId: room.id })
      setPasswordInput('')
      setPasswordError('')
      return
    }

    // Public room — auto-join then navigate
    setJoiningRoomId(room.id)
    try {
      await roomAPI.join({ room_id: room.id })
      navigate(`/rooms/${room.id}`)
    } catch (error) {
      alert(error.response?.data?.error || t('failedToJoin'))
    } finally {
      setJoiningRoomId(null)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('requiredFields'))
      return
    }
    setJoiningRoomId(passwordModal.roomId)
    try {
      await roomAPI.join({ room_id: passwordModal.roomId, password: passwordInput })
      setPasswordModal({ open: false, roomId: null })
      navigate(`/rooms/${passwordModal.roomId}`)
    } catch (error) {
      const msg = error.response?.data?.error
      if (msg === 'Invalid password') {
        setPasswordError(t('invalidRoomPassword'))
      } else {
        setPasswordError(msg || t('failedToJoin'))
      }
    } finally {
      setJoiningRoomId(null)
    }
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
            <div key={room.id} onClick={(e) => handleRoomClick(e, room)} className="content-card room-card" style={{ position: 'relative', cursor: 'pointer' }}>
              {/* Кнопка удаления — только для своих лобби */}
              {user && room.host?.id === user.id && (
                <button
                  className="room-delete-btn"
                  onClick={(e) => handleDeleteRoom(e, room.id)}
                  title={t('deleteRoom')}
                >
                  ✕
                </button>
              )}

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
            </div>
          ))
        )}
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(createdRoom) => {
          fetchRooms()
          if (createdRoom?.id) {
            navigate(`/rooms/${createdRoom.id}`)
          }
        }}
      />

      {/* Password modal for private rooms */}
      {passwordModal.open && (
        <div className="modal-overlay" onClick={() => setPasswordModal({ open: false, roomId: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('roomPassword')}</h2>
              <button className="modal-close" onClick={() => setPasswordModal({ open: false, roomId: null })}>✕</button>
            </div>
            <div className="form-group">
              <label>{t('password')}</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder={t('roomPassword')}
                autoFocus
              />
              {passwordError && <div className="error-message">{passwordError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setPasswordModal({ open: false, roomId: null })}>
                {t('cancel')}
              </button>
              <button className="btn-primary" onClick={handlePasswordSubmit} disabled={joiningRoomId !== null}>
                {joiningRoomId ? t('loading') : t('joinRoom')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Rooms
