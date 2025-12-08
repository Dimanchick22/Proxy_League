import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tournamentAPI } from '../services/api'
import CreateTournamentModal from '../components/CreateTournamentModal'
import { useTranslation } from '../hooks/useTranslation'

const Tournaments = () => {
  const { t } = useTranslation()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchTournaments()
  }, [filter])

  const fetchTournaments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await tournamentAPI.getAll(params)
      setTournaments(response.data || [])
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in_progress': return 'badge-warning'
      case 'completed': return 'badge-success'
      case 'cancelled': return 'badge-danger'
      case 'pending': return 'badge-info'
      default: return ''
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress': return '⚔️'
      case 'completed': return '🏆'
      case 'cancelled': return '✖'
      case 'pending': return '⏳'
      default: return '•'
    }
  }

  const getTournamentIcon = (type) => {
    switch (type) {
      case 'single_elimination': return '🎯'
      case 'double_elimination': return '⚡'
      case 'round_robin': return '🔄'
      default: return '🏅'
    }
  }

  const getProgressPercentage = (current, max) => {
    return Math.min((current / max) * 100, 100)
  }

  if (loading) return <div className="loading">{t('loading')}</div>

  return (
    <div className="tournaments-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-icon">🏆</div>
          <div>
            <h1>{t('tournaments')}</h1>
            <p className="page-subtitle">{t('joinOrCreate')}</p>
          </div>
        </div>
        <button className="btn-primary btn-large" onClick={() => setIsModalOpen(true)}>
          <span>+</span>
          {t('createTournament')}
        </button>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
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
        {tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>{t('noTournaments')}</h3>
            <p>{t('joinOrCreate')}</p>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              + {t('createTournament')}
            </button>
          </div>
        ) : (
          tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/tournaments/${tournament.id}`}
              className="content-card tournament-card"
            >
              <div className="card-header">
                <div className="card-icon">{getTournamentIcon(tournament.type)}</div>
                <div className="card-badges">
                  <span className={`badge ${getStatusBadgeClass(tournament.status)}`}>
                    <span className="badge-icon">{getStatusIcon(tournament.status)}</span>
                    {t(tournament.status)}
                  </span>
                  <span className="badge badge-accent">
                    {t(tournament.type)}
                  </span>
                </div>
              </div>

              <div className="card-content">
                <h3 className="card-title">{tournament.name}</h3>
                <p className="card-description">
                  {tournament.description || t('noDescriptionProvided')}
                </p>
              </div>

              <div className="card-meta">
                <div className="meta-item">
                  <div className="meta-icon">👥</div>
                  <div className="meta-content">
                    <div className="meta-label">{t('participants')}</div>
                    <div className="meta-value">
                      {tournament.participants?.length || 0}/{tournament.max_players}
                    </div>
                  </div>
                </div>

                <div className="meta-item">
                  <div className="meta-icon">🎖️</div>
                  <div className="meta-content">
                    <div className="meta-label">{t('organizer')}</div>
                    <div className="meta-value organizer-name">
                      {tournament.creator?.username || t('toBeDetermined')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${getProgressPercentage(tournament.participants?.length || 0, tournament.max_players)}%`
                    }}
                  />
                </div>
                <div className="progress-label">
                  {getProgressPercentage(tournament.participants?.length || 0, tournament.max_players).toFixed(0)}% {t('capacity')}
                </div>
              </div>

              <div className="card-footer">
                <div className="participant-avatars">
                  {tournament.participants && tournament.participants.length > 0 ? (
                    <>
                      {tournament.participants.slice(0, 3).map((participant, index) => (
                        <div key={participant.id} className="participant-avatar" style={{ zIndex: 10 - index }}>
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.username} />
                          ) : (
                            <div className="avatar-initial">{participant.username.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                      ))}
                      {tournament.participants.length > 3 && (
                        <div className="participant-more">+{tournament.participants.length - 3}</div>
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

      <CreateTournamentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTournaments}
      />
    </div>
  )
}

export default Tournaments
