import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tournamentAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import ChatBox from '../components/ChatBox'
import { useTranslation } from '../hooks/useTranslation'

const TournamentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournament()
  }, [id])

  const fetchTournament = async () => {
    try {
      const response = await tournamentAPI.getById(id)
      setTournament(response.data)
    } catch (error) {
      console.error('Failed to fetch tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    try {
      await tournamentAPI.join(id)
      fetchTournament()
    } catch (error) {
      console.error('Failed to join tournament:', error)
      alert(error.response?.data?.error || t('failedToJoin'))
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    }
    return statusMap[status] || 'badge-default'
  }

  const isUserParticipant = () => {
    return tournament?.participants?.some(p => p.id === user?.id)
  }

  const canJoinTournament = () => {
    return tournament?.status === 'pending' &&
           !isUserParticipant() &&
           tournament.participants?.length < tournament.max_players
  }

  if (loading) {
    return <div className="loading">{t('loading')}</div>
  }

  if (!tournament) {
    return (
      <div className="error-container">
        <div className="error-icon">🏆</div>
        <h2 className="error-title">{t('tournamentNotFound')}</h2>
        <button onClick={() => navigate('/tournaments')} className="btn-primary">
          {t('tournaments')}
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
              <button onClick={() => navigate('/tournaments')} className="back-button">
                ← {t('tournaments')}
              </button>
              <h1 className="detail-title">{tournament.name}</h1>
              <p className="detail-description">
                {tournament.description || t('noDescriptionProvided')}
              </p>
            </div>

            <div className="detail-badges">
              <span className="badge">{t(tournament.type)}</span>
              <span className={`badge ${getStatusBadgeClass(tournament.status)}`}>
                {t(tournament.status)}
              </span>
              <span className="badge badge-info">
                <span className="badge-icon">👥</span>
                {tournament.participants?.length || 0}/{tournament.max_players}
              </span>
            </div>

            {canJoinTournament() && (
              <button onClick={handleJoin} className="btn-primary btn-large">
                <span>🏆</span>
                {t('joinTournament')}
              </button>
            )}

            {isUserParticipant() && tournament.status === 'pending' && (
              <div className="participant-badge">
                <span className="badge-icon">✅</span>
                {t('participants')}
              </div>
            )}
          </div>

          {/* Информация о турнире */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <div className="info-content">
                <div className="info-label">{t('tournamentType')}</div>
                <div className="info-value">{t(tournament.type)}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <div className="info-label">{t('organizer')}</div>
                <div className="info-value">{tournament.creator?.username || t('toBeDetermined')}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📊</div>
              <div className="info-content">
                <div className="info-label">{t('status')}</div>
                <div className="info-value">{t(tournament.status)}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">👥</div>
              <div className="info-content">
                <div className="info-label">{t('capacity')}</div>
                <div className="info-value">
                  {tournament.participants?.length || 0}/{tournament.max_players}
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
                {tournament.participants?.length || 0}
              </span>
            </div>

            {tournament.participants && tournament.participants.length > 0 ? (
              <div className="participants-grid">
                {tournament.participants.map((participant, index) => (
                  <div key={participant.id} className="participant-card">
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
                      <div className="participant-name">{participant.username}</div>
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

          {/* Матчи */}
          {tournament.matches && tournament.matches.length > 0 && (
            <div className="detail-section">
              <div className="section-header">
                <h2>
                  <span className="section-icon">⚔️</span>
                  {t('matches')}
                </h2>
                <span className="section-count">
                  {tournament.matches.length}
                </span>
              </div>

              <div className="matches-list">
                {tournament.matches.map((match) => (
                  <div key={match.id} className="match-card">
                    <div className="match-header">
                      <span className="match-round">{t('round')} {match.round || 1}</span>
                      {match.winner_id && (
                        <span className="match-status completed">
                          <span className="status-dot"></span>
                          {t('completed')}
                        </span>
                      )}
                      {!match.winner_id && match.player1_id && match.player2_id && (
                        <span className="match-status in-progress">
                          <span className="status-dot"></span>
                          {t('matchInProgress')}
                        </span>
                      )}
                      {(!match.player1_id || !match.player2_id) && (
                        <span className="match-status pending">
                          <span className="status-dot"></span>
                          {t('waitingForOpponent')}
                        </span>
                      )}
                    </div>

                    <div className="match-body">
                      <div className={`match-player ${match.winner_id === match.player1_id ? 'winner' : ''}`}>
                        <div className="player-info">
                          <div className="player-avatar">
                            {match.player1?.avatar ? (
                              <img src={match.player1.avatar} alt={match.player1.username} />
                            ) : (
                              <div className="player-initial">
                                {match.player1?.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="player-details">
                            <div className="player-name">
                              {match.player1?.username || t('toBeDetermined')}
                            </div>
                            {match.player1?.rating && (
                              <div className="player-rating">⭐ {match.player1.rating}</div>
                            )}
                          </div>
                        </div>
                        {match.winner_id === match.player1_id && (
                          <div className="winner-badge">👑</div>
                        )}
                      </div>

                      <div className="match-versus">
                        <span className="versus-text">{t('versus')}</span>
                      </div>

                      <div className={`match-player ${match.winner_id === match.player2_id ? 'winner' : ''}`}>
                        <div className="player-info">
                          <div className="player-avatar">
                            {match.player2?.avatar ? (
                              <img src={match.player2.avatar} alt={match.player2.username} />
                            ) : (
                              <div className="player-initial">
                                {match.player2?.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="player-details">
                            <div className="player-name">
                              {match.player2?.username || t('toBeDetermined')}
                            </div>
                            {match.player2?.rating && (
                              <div className="player-rating">⭐ {match.player2.rating}</div>
                            )}
                          </div>
                        </div>
                        {match.winner_id === match.player2_id && (
                          <div className="winner-badge">👑</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Чат */}
        <div className="detail-sidebar">
          <ChatBox roomId={parseInt(id)} title={t('tournamentChat')} />
        </div>
      </div>
    </div>
  )
}

export default TournamentDetail
