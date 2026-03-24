import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomAPI, gameAPI, userHeroAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import ChatBox from '../components/ChatBox'
import { useTranslation } from '../hooks/useTranslation'

const TIMER_DURATION = 5 * 60 // 5 минут в секундах

const RoomDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState(null)
  const [myHeroes, setMyHeroes] = useState([])
  const [selectedChars, setSelectedChars] = useState([])
  const [showCharSelect, setShowCharSelect] = useState(false)
  const [timerLeft, setTimerLeft] = useState(TIMER_DURATION)
  const [stageInput, setStageInput] = useState({ minutes: '', seconds: '' })
  const [activeStageDialog, setActiveStageDialog] = useState(null) // 1 or 2
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const timerRef = useRef(null)
  const pollRef = useRef(null)

  const fetchRoom = useCallback(async () => {
    try {
      const response = await roomAPI.getById(id)
      setRoom(response.data)
    } catch (error) {
      console.error('Failed to fetch room:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchMatch = useCallback(async () => {
    try {
      const response = await gameAPI.getMatch(id)
      setMatch(response.data)
    } catch {
      setMatch(null)
    }
  }, [id])

  const fetchMyHeroes = useCallback(async () => {
    try {
      const response = await userHeroAPI.getAll()
      setMyHeroes(response.data || [])
    } catch {
      setMyHeroes([])
    }
  }, [])

  useEffect(() => {
    fetchRoom()
    fetchMatch()
    fetchMyHeroes()
  }, [fetchRoom, fetchMatch, fetchMyHeroes])

  // Polling матча каждые 3 секунды
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchMatch()
      fetchRoom()
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [fetchMatch, fetchRoom])

  // Таймер — запускается когда матч in_progress
  useEffect(() => {
    if (match?.status === 'in_progress' && match?.start_time) {
      const startedAt = new Date(match.start_time).getTime()
      const tick = () => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        const left = Math.max(0, TIMER_DURATION - elapsed)
        setTimerLeft(left)
      }
      tick()
      timerRef.current = setInterval(tick, 1000)
      return () => clearInterval(timerRef.current)
    } else {
      clearInterval(timerRef.current)
    }
  }, [match?.status, match?.start_time])

  // Открыть окно выбора персонажей когда нужно
  useEffect(() => {
    if (match?.status === 'character_selection') {
      const myChars = isPlayer1() ? match.player1_characters : match.player2_characters
      const parsed = tryParseChars(myChars)
      if (parsed.length < 3) {
        setShowCharSelect(true)
      }
    }
  }, [match?.status])

  const tryParseChars = (str) => {
    try { return JSON.parse(str || '[]') } catch { return [] }
  }

  const isPlayer1 = () => match?.player1?.id === user?.id
  const isPlayer2 = () => match?.player2?.id === user?.id
  const isMatchParticipant = () => isPlayer1() || isPlayer2()
  const isUserHost = () => room?.host?.id === user?.id
  const isUserParticipant = () => room?.participants?.some(p => p.id === user?.id)

  const canStartGame = () =>
    isUserHost() &&
    room?.status !== 'in_game' &&
    room?.status !== 'completed' &&
    (room?.participants?.length || 0) >= 2

  const mySubmittedChars = () => {
    if (!match) return []
    return tryParseChars(isPlayer1() ? match.player1_characters : match.player2_characters)
  }

  const opponentSubmittedChars = () => {
    if (!match) return []
    return tryParseChars(isPlayer1() ? match.player2_characters : match.player1_characters)
  }

  const hasISubmittedStage = (stage) => {
    if (!match) return false
    if (stage === 1) return isPlayer1() ? match.player1_stage1_time > 0 : match.player2_stage1_time > 0
    return isPlayer1() ? match.player1_stage2_time > 0 : match.player2_stage2_time > 0
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatTimeFloat = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // --- Handlers ---

  const handleStartGame = async () => {
    try {
      await gameAPI.startGame(id)
      await fetchMatch()
      await fetchRoom()
    } catch (error) {
      alert(error.response?.data?.error || t('failedToStartGame'))
    }
  }

  const toggleCharSelect = (heroId) => {
    setSelectedChars(prev => {
      if (prev.includes(heroId)) return prev.filter(x => x !== heroId)
      if (prev.length >= 3) return prev
      return [...prev, heroId]
    })
  }

  const handleSubmitCharacters = async () => {
    if (selectedChars.length !== 3) return
    try {
      await gameAPI.submitCharacters(id, selectedChars)
      setShowCharSelect(false)
      setSelectedChars([])
      await fetchMatch()
    } catch (error) {
      alert(error.response?.data?.error || t('failedToSubmitCharacters'))
    }
  }

  const handleOpenStageDialog = (stage) => {
    setStageInput({ minutes: '', seconds: '' })
    setActiveStageDialog(stage)
  }

  const handleSubmitStageTime = async () => {
    const mins = parseInt(stageInput.minutes) || 0
    const secs = parseInt(stageInput.seconds) || 0
    const total = mins * 60 + secs
    if (total <= 0) {
      alert(t('invalidTime'))
      return
    }
    try {
      await gameAPI.submitStageTime(id, activeStageDialog, total)
      setActiveStageDialog(null)
      await fetchMatch()
    } catch (error) {
      alert(error.response?.data?.error || t('failedToSubmitTime'))
    }
  }

  const handleJoin = async () => {
    if (room?.is_private) {
      setPasswordInput('')
      setPasswordError('')
      setShowPasswordModal(true)
      return
    }
    try {
      await roomAPI.join({ room_id: parseInt(id) })
      fetchRoom()
    } catch (error) {
      alert(error.response?.data?.error || t('failedToJoin'))
    }
  }

  const handlePasswordJoin = async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('requiredFields'))
      return
    }
    try {
      await roomAPI.join({ room_id: parseInt(id), password: passwordInput })
      setShowPasswordModal(false)
      fetchRoom()
    } catch (error) {
      const msg = error.response?.data?.error
      if (msg === 'Invalid password') {
        setPasswordError(t('invalidRoomPassword'))
      } else {
        setPasswordError(msg || t('failedToJoin'))
      }
    }
  }

  const handleLeave = async () => {
    try {
      await roomAPI.leave(id)
      navigate('/rooms')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to leave room')
    }
  }

  const handleDeleteRoom = async () => {
    if (!window.confirm(t('confirmDeleteRoom'))) return
    try {
      await roomAPI.delete(id)
      navigate('/rooms')
    } catch (error) {
      alert(error.response?.data?.error || t('failedToDelete'))
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

  const canJoinRoom = () =>
    room?.status === 'waiting' &&
    !isUserParticipant() &&
    room.participants?.length < room.max_players

  // Определить оппонента
  const getOpponent = () => {
    if (!match) return null
    return isPlayer1() ? match.player2 : match.player1
  }

  const getEloChange = () => {
    if (!match || match.status !== 'completed') return null
    return isPlayer1() ? match.player1_elo_change : match.player2_elo_change
  }

  if (loading) return <div className="loading">{t('loading')}</div>

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

  const myParsedChars = mySubmittedChars()
  const opponentParsedChars = opponentSubmittedChars()
  const opponent = getOpponent()

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
              {canStartGame() && (
                <button onClick={handleStartGame} className="btn-primary btn-large" style={{ background: 'var(--success)', color: 'var(--bg-primary)' }}>
                  <span>▶</span>
                  {t('startGame')}
                </button>
              )}
              {isUserHost() && room?.status !== 'in_game' && (
                <button onClick={handleDeleteRoom} className="btn-danger btn-large">
                  <span>🗑</span>
                  {t('deleteRoom')}
                </button>
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
                <div className="info-value">{room.participants?.length || 0}/{room.max_players}</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">{room.is_private ? '🔒' : '🌐'}</div>
              <div className="info-content">
                <div className="info-label">{t('type')}</div>
                <div className="info-value">{room.is_private ? t('private') : t('public')}</div>
              </div>
            </div>
          </div>

          {/* ===== ИГРОВОЙ БЛОК ===== */}
          {match && (
            <div className="detail-section game-section">
              <div className="section-header">
                <h2>
                  <span className="section-icon">🎮</span>
                  {t('gameMatch')}
                </h2>
                <span className={`badge ${
                  match.status === 'completed' ? 'badge-success' :
                  match.status === 'in_progress' ? 'badge-info' : 'badge-warning'
                }`}>
                  {t(match.status) || match.status}
                </span>
              </div>

              {/* --- ВЫБОР ПЕРСОНАЖЕЙ --- */}
              {match.status === 'character_selection' && isMatchParticipant() && (
                <div className="game-phase-block">
                  <div className="phase-title">
                    <span>🧩</span> {t('characterSelection')}
                  </div>
                  <div className="char-selection-status">
                    <div className={`player-ready ${myParsedChars.length === 3 ? 'ready' : ''}`}>
                      <span>{myParsedChars.length === 3 ? '✅' : '⏳'}</span>
                      {t('you')} — {myParsedChars.length === 3 ? t('ready') : t('selecting')}
                    </div>
                    <div className={`player-ready ${opponentParsedChars.length === 3 ? 'ready' : ''}`}>
                      <span>{opponentParsedChars.length === 3 ? '✅' : '⏳'}</span>
                      {opponent?.username || t('opponent')} — {opponentParsedChars.length === 3 ? t('ready') : t('selecting')}
                    </div>
                  </div>
                  {myParsedChars.length < 3 && (
                    <button className="btn-primary" onClick={() => setShowCharSelect(true)}>
                      {t('selectCharacters')}
                    </button>
                  )}
                </div>
              )}

              {/* --- IN PROGRESS: ТАЙМЕР + КНОПКИ ЭТАПОВ --- */}
              {(match.status === 'in_progress' || match.status === 'stage2_input') && isMatchParticipant() && (
                <div className="game-phase-block">
                  {match.status === 'in_progress' && (
                    <div className="game-timer">
                      <div className="timer-label">{t('timeLeft')}</div>
                      <div className={`timer-value ${timerLeft <= 30 ? 'timer-urgent' : ''}`}>
                        {formatTime(timerLeft)}
                      </div>
                    </div>
                  )}

                  <div className="vs-block">
                    <div className="vs-player">
                      <div className="vs-name">{t('you')} ({user?.username})</div>
                      <div className="vs-rating">⭐ {user?.rating}</div>
                    </div>
                    <div className="vs-text">VS</div>
                    <div className="vs-player">
                      <div className="vs-name">{opponent?.username}</div>
                      <div className="vs-rating">⭐ {opponent?.rating}</div>
                    </div>
                  </div>

                  <div className="stages-block">
                    {/* Этап 1 */}
                    <div className="stage-card">
                      <div className="stage-header">
                        <span>⚔️</span> {t('stage1')}
                      </div>
                      {hasISubmittedStage(1) ? (
                        <div className="stage-submitted">
                          ✅ {t('timeSubmitted')}: {formatTimeFloat(isPlayer1() ? match.player1_stage1_time : match.player2_stage1_time)}
                        </div>
                      ) : (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleOpenStageDialog(1)}
                        >
                          {t('submitTime')}
                        </button>
                      )}
                    </div>

                    {/* Этап 2 */}
                    <div className={`stage-card ${match.status !== 'stage2_input' ? 'stage-locked' : ''}`}>
                      <div className="stage-header">
                        <span>🏆</span> {t('stage2')}
                      </div>
                      {match.status !== 'stage2_input' ? (
                        <div className="stage-waiting">{t('waitingForStage1')}</div>
                      ) : hasISubmittedStage(2) ? (
                        <div className="stage-submitted">
                          ✅ {t('timeSubmitted')}: {formatTimeFloat(isPlayer1() ? match.player1_stage2_time : match.player2_stage2_time)}
                        </div>
                      ) : (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleOpenStageDialog(2)}
                        >
                          {t('submitTime')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Статус таймсов оппонента */}
                  <div className="opponent-times">
                    <div className="opponent-times-title">{t('opponentProgress')}</div>
                    <div className="opponent-time-item">
                      {t('stage1')}: {
                        (isPlayer1() ? match.player2_stage1_time : match.player1_stage1_time) > 0
                          ? `✅ ${formatTimeFloat(isPlayer1() ? match.player2_stage1_time : match.player1_stage1_time)}`
                          : '⏳'
                      }
                    </div>
                    <div className="opponent-time-item">
                      {t('stage2')}: {
                        (isPlayer1() ? match.player2_stage2_time : match.player1_stage2_time) > 0
                          ? `✅ ${formatTimeFloat(isPlayer1() ? match.player2_stage2_time : match.player1_stage2_time)}`
                          : '⏳'
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* --- РЕЗУЛЬТАТЫ --- */}
              {match.status === 'completed' && (
                <div className="game-phase-block result-block">
                  <div className="result-title">
                    {match.winner_id
                      ? (match.winner_id === user?.id ? '🏆 ' + t('youWon') : '💔 ' + t('youLost'))
                      : '🤝 ' + t('draw')}
                  </div>

                  {match.winner && (
                    <div className="result-winner">
                      {t('winner')}: <strong>{match.winner.username}</strong>
                    </div>
                  )}

                  <div className="result-times">
                    <div className="result-player">
                      <div className="result-player-name">{match.player1?.username}</div>
                      <div>{t('stage1')}: {formatTimeFloat(match.player1_stage1_time)}</div>
                      <div>{t('stage2')}: {formatTimeFloat(match.player1_stage2_time)}</div>
                      <div className="result-total">
                        {t('total')}: {formatTimeFloat(match.player1_stage1_time + match.player1_stage2_time)}
                      </div>
                    </div>
                    <div className="result-vs">VS</div>
                    <div className="result-player">
                      <div className="result-player-name">{match.player2?.username}</div>
                      <div>{t('stage1')}: {formatTimeFloat(match.player2_stage1_time)}</div>
                      <div>{t('stage2')}: {formatTimeFloat(match.player2_stage2_time)}</div>
                      <div className="result-total">
                        {t('total')}: {formatTimeFloat(match.player2_stage1_time + match.player2_stage2_time)}
                      </div>
                    </div>
                  </div>

                  {isMatchParticipant() && getEloChange() !== null && (
                    <div className={`elo-change ${getEloChange() >= 0 ? 'elo-positive' : 'elo-negative'}`}>
                      {t('eloChange')}: {getEloChange() >= 0 ? '+' : ''}{getEloChange()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Участники */}
          <div className="detail-section">
            <div className="section-header">
              <h2>
                <span className="section-icon">👥</span>
                {t('participants')}
              </h2>
              <span className="section-count">{room.participants?.length || 0}</span>
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
        </div>

        {/* Чат */}
        <div className="detail-sidebar">
          <ChatBox roomId={parseInt(id)} title={t('roomChat')} />
        </div>
      </div>

      {/* ===== МОДАЛ ВЫБОРА ПЕРСОНАЖЕЙ ===== */}
      {showCharSelect && (
        <div className="modal-overlay" onClick={() => setShowCharSelect(false)}>
          <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('selectCharacters')} (3)</h2>
              <button className="modal-close" onClick={() => setShowCharSelect(false)}>✕</button>
            </div>

            {myHeroes.length === 0 ? (
              <div className="modal-empty">
                <p>{t('noHeroesYet')}</p>
                <p>{t('loadYourHeroes')}</p>
              </div>
            ) : (
              <>
                <p className="modal-hint">{t('selectCharactersHint')} ({selectedChars.length}/3)</p>
                <div className="char-grid">
                  {myHeroes.map(hero => {
                    const isSelected = selectedChars.includes(hero.id)
                    const isDisabled = !isSelected && selectedChars.length >= 3
                    return (
                      <div
                        key={hero.id}
                        className={`char-card ${isSelected ? 'char-selected' : ''} ${isDisabled ? 'char-disabled' : ''}`}
                        onClick={() => !isDisabled && toggleCharSelect(hero.id)}
                      >
                        {hero.role_square_url ? (
                          <img src={hero.role_square_url} alt={hero.name} className="char-img" />
                        ) : (
                          <div className="char-img-placeholder">{hero.name?.charAt(0)}</div>
                        )}
                        <div className="char-name">{hero.name}</div>
                        <div className="char-level">Lv.{hero.level}</div>
                        {isSelected && <div className="char-check">✓</div>}
                      </div>
                    )
                  })}
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowCharSelect(false)}>
                    {t('cancel')}
                  </button>
                  <button
                    className="btn-primary"
                    disabled={selectedChars.length !== 3}
                    onClick={handleSubmitCharacters}
                  >
                    {t('confirmSelection')} ({selectedChars.length}/3)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== МОДАЛ ВВОДА ПАРОЛЯ ===== */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('roomPassword')}</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>{t('password')}</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordJoin()}
                placeholder={t('roomPassword')}
                autoFocus
              />
              {passwordError && <div className="error-message">{passwordError}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                {t('cancel')}
              </button>
              <button className="btn-primary" onClick={handlePasswordJoin}>
                {t('joinRoom')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== МОДАЛ ВВОДА ВРЕМЕНИ ЭТАПА ===== */}
      {activeStageDialog !== null && (
        <div className="modal-overlay" onClick={() => setActiveStageDialog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('submitStageTime')} — {t(activeStageDialog === 1 ? 'stage1' : 'stage2')}</h2>
              <button className="modal-close" onClick={() => setActiveStageDialog(null)}>✕</button>
            </div>
            <p className="modal-hint">{t('enterYourClearTime')}</p>
            <div className="time-input-row">
              <div className="time-field">
                <label>{t('minutes')}</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={stageInput.minutes}
                  onChange={e => setStageInput(prev => ({ ...prev, minutes: e.target.value }))}
                  placeholder="0"
                  className="time-input"
                />
              </div>
              <div className="time-separator">:</div>
              <div className="time-field">
                <label>{t('seconds')}</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={stageInput.seconds}
                  onChange={e => setStageInput(prev => ({ ...prev, seconds: e.target.value }))}
                  placeholder="00"
                  className="time-input"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setActiveStageDialog(null)}>
                {t('cancel')}
              </button>
              <button className="btn-primary" onClick={handleSubmitStageTime}>
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomDetail
