import React, { useState, useEffect } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const Leaderboard = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      // Сортируем по рейтингу
      const sortedUsers = response.data.sort((a, b) => b.rating - a.rating)
      setLeaders(sortedUsers)
      setError(null)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError(t('errorLoadingLeaderboard'))
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (position) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return position
  }

  const getWinRate = (wins, totalMatches) => {
    if (totalMatches === 0) return 0
    return Math.round((wins / totalMatches) * 100)
  }

  const getRankBadge = (rating) => {
    if (rating >= 2000) return { name: 'Legendary', class: 'rank-legendary' }
    if (rating >= 1800) return { name: 'Master', class: 'rank-master' }
    if (rating >= 1600) return { name: 'Diamond', class: 'rank-diamond' }
    if (rating >= 1400) return { name: 'Platinum', class: 'rank-platinum' }
    if (rating >= 1200) return { name: 'Gold', class: 'rank-gold' }
    if (rating >= 1000) return { name: 'Silver', class: 'rank-silver' }
    return { name: 'Bronze', class: 'rank-bronze' }
  }

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>{t('leaderboard')}</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>{t('leaderboard')}</h1>
        </div>
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchLeaderboard} className="btn-primary">
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <div className="leaderboard-title">
          <h1>🏆 {t('leaderboard')}</h1>
          <p className="leaderboard-subtitle">{t('topPlayers')}</p>
        </div>
        <button onClick={fetchLeaderboard} className="btn-ghost">
          <span>🔄</span>
          {t('refresh')}
        </button>
      </div>

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <div className="podium-container">
          {/* 2nd Place */}
          <div className="podium-player podium-second">
            <div className="podium-rank">🥈</div>
            <div className="podium-avatar">
              {leaders[1].avatar ? (
                <img src={leaders[1].avatar} alt={leaders[1].username} />
              ) : (
                <div className="podium-initial">{leaders[1].username.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="podium-info">
              <div className="podium-username">{leaders[1].username}</div>
              <div className="podium-rating">{leaders[1].rating}</div>
              <div className="podium-stats">
                {leaders[1].wins}W / {leaders[1].losses}L
              </div>
            </div>
            <div className="podium-platform podium-platform-second">2</div>
          </div>

          {/* 1st Place */}
          <div className="podium-player podium-first">
            <div className="podium-rank">🥇</div>
            <div className="podium-crown">👑</div>
            <div className="podium-avatar">
              {leaders[0].avatar ? (
                <img src={leaders[0].avatar} alt={leaders[0].username} />
              ) : (
                <div className="podium-initial">{leaders[0].username.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="podium-info">
              <div className="podium-username">{leaders[0].username}</div>
              <div className="podium-rating">{leaders[0].rating}</div>
              <div className="podium-stats">
                {leaders[0].wins}W / {leaders[0].losses}L
              </div>
            </div>
            <div className="podium-platform podium-platform-first">1</div>
          </div>

          {/* 3rd Place */}
          <div className="podium-player podium-third">
            <div className="podium-rank">🥉</div>
            <div className="podium-avatar">
              {leaders[2].avatar ? (
                <img src={leaders[2].avatar} alt={leaders[2].username} />
              ) : (
                <div className="podium-initial">{leaders[2].username.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="podium-info">
              <div className="podium-username">{leaders[2].username}</div>
              <div className="podium-rating">{leaders[2].rating}</div>
              <div className="podium-stats">
                {leaders[2].wins}W / {leaders[2].losses}L
              </div>
            </div>
            <div className="podium-platform podium-platform-third">3</div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-rank">{t('rank')}</th>
              <th className="col-player">{t('player')}</th>
              <th className="col-tier">{t('tier')}</th>
              <th className="col-rating">{t('rating')}</th>
              <th className="col-matches">{t('matches')}</th>
              <th className="col-winrate">{t('winRate')}</th>
              <th className="col-record">{t('record')}</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader, index) => {
              const rank = getRankBadge(leader.rating)
              const isCurrentUser = user?.id === leader.id

              return (
                <tr
                  key={leader.id}
                  className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-three' : ''}`}
                >
                  <td className="col-rank">
                    <div className="rank-cell">
                      {typeof getMedalIcon(index + 1) === 'string' ? (
                        <span className="medal-icon">{getMedalIcon(index + 1)}</span>
                      ) : (
                        <span className="rank-number">#{getMedalIcon(index + 1)}</span>
                      )}
                    </div>
                  </td>
                  <td className="col-player">
                    <div className="player-cell">
                      <div className="player-avatar">
                        {leader.avatar ? (
                          <img src={leader.avatar} alt={leader.username} />
                        ) : (
                          <div className="player-initial">{leader.username.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="player-name">
                        {leader.username}
                        {isCurrentUser && <span className="you-badge">{t('you')}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="col-tier">
                    <span className={`rank-badge ${rank.class}`}>{rank.name}</span>
                  </td>
                  <td className="col-rating">
                    <span className="rating-value">{leader.rating}</span>
                  </td>
                  <td className="col-matches">
                    <span className="matches-value">{leader.total_matches || 0}</span>
                  </td>
                  <td className="col-winrate">
                    <div className="winrate-cell">
                      <div className="winrate-bar-container">
                        <div
                          className="winrate-bar"
                          style={{ width: `${getWinRate(leader.wins, leader.total_matches)}%` }}
                        ></div>
                      </div>
                      <span className="winrate-text">{getWinRate(leader.wins, leader.total_matches)}%</span>
                    </div>
                  </td>
                  <td className="col-record">
                    <div className="record-cell">
                      <span className="wins">{leader.wins}W</span>
                      <span className="separator">-</span>
                      <span className="losses">{leader.losses}L</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {leaders.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>{t('noPlayersYet')}</h3>
            <p>{t('beTheFirst')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
