import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tournamentAPI, roomAPI, wsAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from '../hooks/useTranslation'

const Dashboard = () => {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    tournaments: [],
    rooms: [],
    onlineUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, roomsRes, onlineRes] = await Promise.all([
        tournamentAPI.getAll({ limit: 5 }),
        roomAPI.getAll(),
        wsAPI.getOnlineUsers(),
      ])

      setStats({
        tournaments: tournamentsRes.data || [],
        rooms: roomsRes.data || [],
        onlineUsers: onlineRes.data?.count || 0,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      completed: 'badge-success',
      waiting: 'badge-warning',
      ready: 'badge-success',
      in_game: 'badge-info',
    }
    return statusMap[status] || 'badge-default'
  }

  if (loading) {
    return <div className="loading">{t('loading')}</div>
  }

  return (
    <div className="dashboard">
      {/* Заголовок с приветствием */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>{t('welcome')}, {user?.username}!</h1>
          <p className="dashboard-subtitle">{t('exploreFeatures')}</p>
        </div>
        <div className="dashboard-rating-badge">
          <div className="rating-label">{t('yourRating')}</div>
          <div className="rating-value">{user?.rating || 1000}</div>
        </div>
      </div>

      {/* Статистика */}
      <div className="dashboard-stats">
        <div className="stat-card stat-wins">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{user?.wins || 0}</div>
            <div className="stat-label">{t('wins')}</div>
          </div>
        </div>

        <div className="stat-card stat-losses">
          <div className="stat-icon">💔</div>
          <div className="stat-content">
            <div className="stat-value">{user?.losses || 0}</div>
            <div className="stat-label">{t('losses')}</div>
          </div>
        </div>

        <div className="stat-card stat-matches">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <div className="stat-value">{user?.total_matches || 0}</div>
            <div className="stat-label">{t('totalMatches')}</div>
          </div>
        </div>

        <div className="stat-card stat-online">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-value">{stats.onlineUsers}</div>
            <div className="stat-label">{t('onlinePlayers')}</div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="dashboard-content">
        {/* Недавние турниры */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{t('recentTournaments')}</h2>
            <Link to="/tournaments" className="btn-link">
              {t('viewAll')} →
            </Link>
          </div>

          {stats.tournaments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <p>{t('noTournamentsAvailable')}</p>
              <Link to="/tournaments" className="btn-primary">
                {t('createTournament')}
              </Link>
            </div>
          ) : (
            <div className="tournament-list">
              {stats.tournaments.slice(0, 3).map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="tournament-card"
                >
                  <div className="tournament-card-header">
                    <h3>{tournament.name}</h3>
                    <span className={`badge ${getStatusBadgeClass(tournament.status)}`}>
                      {t(tournament.status)}
                    </span>
                  </div>
                  <p className="tournament-description">
                    {tournament.description || t('noDescription')}
                  </p>
                  <div className="tournament-info">
                    <div className="info-item">
                      <span className="info-icon">🎯</span>
                      <span>{t(tournament.type)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">👥</span>
                      <span>
                        {tournament.participants?.length || 0}/{tournament.max_players}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Доступные комнаты */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>{t('availableRooms')}</h2>
            <Link to="/rooms" className="btn-link">
              {t('viewAll')} →
            </Link>
          </div>

          {stats.rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎲</div>
              <p>{t('noRoomsAvailable')}</p>
              <Link to="/rooms" className="btn-primary">
                {t('createRoom')}
              </Link>
            </div>
          ) : (
            <div className="room-list">
              {stats.rooms.slice(0, 3).map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  className="room-card"
                >
                  <div className="room-card-header">
                    <h3>{room.name}</h3>
                    <span className={`badge ${getStatusBadgeClass(room.status)}`}>
                      {t(room.status)}
                    </span>
                  </div>
                  <p className="room-description">
                    {room.description || t('noDescription')}
                  </p>
                  <div className="room-info">
                    <div className="info-item">
                      <span className="info-icon">👤</span>
                      <span>{room.host?.username || 'Unknown'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">👥</span>
                      <span>
                        {room.participants?.length || 0}/{room.max_players} {t('players')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
