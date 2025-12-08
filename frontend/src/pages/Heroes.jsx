import React, { useEffect, useState, useRef } from 'react'
import { userHeroAPI, gameProfileAPI } from '../services/api'
import { useTranslation } from '../hooks/useTranslation'
import '../styles/Heroes.css'

const Heroes = () => {
  const { t } = useTranslation()
  const [heroes, setHeroes] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 44 })
  const [selectedHero, setSelectedHero] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showSetupForm, setShowSetupForm] = useState(false)
  const [notification, setNotification] = useState(null)
  const abortControllerRef = useRef(null)

  // Форма для ввода role_id
  const [roleId, setRoleId] = useState('')
  const [server, setServer] = useState('prod_gf_eu')
  const [gameProfile, setGameProfile] = useState(null)

  // Функция для показа уведомлений
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    loadGameProfile()
    loadHeroes()
  }, [])

  const loadGameProfile = async () => {
    try {
      const response = await gameProfileAPI.get()
      setGameProfile(response.data)
      setRoleId(response.data.role_id)
      setServer(response.data.server)
    } catch (error) {
      console.log('No game profile found')
    }
  }

  const loadHeroes = async () => {
    setLoading(true)
    try {
      const response = await userHeroAPI.getAll()
      setHeroes(response.data || [])
    } catch (error) {
      console.error('Failed to fetch heroes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchHeroes = async (e) => {
    e.preventDefault()

    if (!roleId.trim()) {
      showNotification(t('pleaseEnterGameId'), 'error')
      return
    }

    // Создаем новый AbortController для возможности отмены
    abortControllerRef.current = new AbortController()

    setFetching(true)
    setFetchProgress({ current: 0, total: 44 })

    try {
      // Симулируем прогресс загрузки
      const progressInterval = setInterval(() => {
        setFetchProgress(prev => {
          if (prev.current < prev.total) {
            return { ...prev, current: prev.current + 1 }
          }
          return prev
        })
      }, 800) // Обновляем примерно каждые 800ms

      const response = await userHeroAPI.fetchHeroes(
        {
          role_id: roleId,
          server: server,
        },
        { signal: abortControllerRef.current.signal }
      )

      clearInterval(progressInterval)
      setFetchProgress({ current: 44, total: 44 })

      showNotification(t('heroesLoadedSuccess'), 'success')
      setShowSetupForm(false)
      await loadHeroes()
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Request was cancelled')
        showNotification(t('cancelled'), 'info')
      } else {
        console.error('Failed to fetch heroes:', error)
        showNotification(t('heroesLoadError'), 'error')
      }
    } finally {
      setFetching(false)
      setFetchProgress({ current: 0, total: 44 })
      abortControllerRef.current = null
    }
  }

  const handleCancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setFetching(false)
      setFetchProgress({ current: 0, total: 44 })
      setShowSetupForm(false)
    }
  }

  const handleHeroClick = async (hero) => {
    setLoading(true)
    try {
      const response = await userHeroAPI.getById(hero.id)
      setSelectedHero(response.data)
      setShowModal(true)
    } catch (error) {
      console.error('Failed to fetch hero details:', error)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedHero(null)
  }

  const getRarityStars = (rarity) => {
    return rarity === 'S' ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐'
  }

  const getElementColor = (elementType) => {
    const colors = {
      200: '#f59e0b', // Physical - orange
      201: '#ef4444', // Fire - red
      202: '#3b82f6', // Ice - blue
      203: '#8b5cf6', // Electric - purple
      205: '#10b981', // Ether - green
    }
    return colors[elementType] || '#6b7280'
  }

  const percentage = Math.round((fetchProgress.current / fetchProgress.total) * 100)

  if (loading && heroes.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="heroes-page">
      {/* Custom Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'info' && 'ℹ'}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      <div className="heroes-header">
        <h1>{t('myHeroes')}</h1>
        <div className="heroes-actions">
          {gameProfile && (
            <span className="game-profile-info">
              {t('gameId')}: {gameProfile.role_id} • {t('server')}: {gameProfile.server}
            </span>
          )}
          <button
            className="btn-primary"
            onClick={() => setShowSetupForm(!showSetupForm)}
            disabled={fetching}
          >
            {gameProfile ? t('updateHeroes') : t('setupProfile')}
          </button>
        </div>
      </div>

      {showSetupForm && (
        <div className="setup-form-container">
          <form onSubmit={handleFetchHeroes} className="setup-form">
            <h3>{t('gameProfileSetup')}</h3>

            {fetching && (
              <div className="fetch-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="progress-text">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <p className="progress-message">
                  {t('loadingHeroes')} - {percentage}%
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="roleId">{t('gameId')}:</label>
              <input
                id="roleId"
                type="text"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                placeholder={t('gameIdPlaceholder')}
                required
                disabled={fetching}
              />
              <small>{t('gameIdHint')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="server">{t('server')}:</label>
              <select
                id="server"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                disabled={fetching}
              >
                <option value="prod_gf_eu">{t('serverEurope')}</option>
                <option value="prod_gf_us">{t('serverAmerica')}</option>
                <option value="prod_gf_jp">{t('serverAsia')}</option>
              </select>
            </div>

            <div className="form-actions">
              {fetching ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelFetch}
                >
                  {t('cancel')}
                </button>
              ) : (
                <>
                  <button type="submit" className="btn-primary">
                    {t('loadHeroes')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowSetupForm(false)}
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {heroes.length === 0 && !showSetupForm ? (
        <div className="empty-state">
          <p>{t('noHeroesYet')}</p>
          <button
            className="btn-primary"
            onClick={() => setShowSetupForm(true)}
          >
            {t('loadYourHeroes')}
          </button>
        </div>
      ) : (
        <div className="heroes-grid">
          {heroes.map((hero) => (
            <div
              key={hero.id}
              className="hero-card"
              onClick={() => handleHeroClick(hero)}
              style={{
                borderColor: hero.vertical_painting_color || '#6b7280',
              }}
            >
              <div
                className="hero-card-image"
                style={{
                  backgroundImage: `url(${hero.role_square_url})`,
                  backgroundColor: hero.vertical_painting_color || '#1a1a1a'
                }}
              >
                <div className="hero-level">{t('heroLevel')} {hero.level}</div>
                <div className="hero-rarity">{getRarityStars(hero.rarity)}</div>
              </div>

              <div className="hero-card-content">
                <h3>{hero.name}</h3>
                <p className="hero-full-name">{hero.full_name}</p>
                <div className="hero-info">
                  <span className="hero-camp">{hero.camp_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedHero && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>

            <div className="hero-detail">
              <div className="hero-detail-header">
                <img
                  src={selectedHero.role_vertical_painting_url}
                  alt={selectedHero.name}
                  className="hero-detail-image"
                />
                <div className="hero-detail-info">
                  <h2>{selectedHero.full_name}</h2>
                  <p className="hero-detail-name">{selectedHero.name}</p>
                  <div className="hero-detail-stats">
                    <span>{t('heroLevel')}: {selectedHero.level}</span>
                    <span>{t('rarity')}: {selectedHero.rarity}</span>
                    <span>{t('rank')}: {selectedHero.rank}</span>
                  </div>
                  <p className="hero-camp">{selectedHero.camp_name}</p>
                </div>
              </div>

              {selectedHero.weapon && (
                <div className="hero-weapon">
                  <h3>{t('heroWeapon')}</h3>
                  <div className="weapon-card">
                    <img src={selectedHero.weapon.icon} alt={selectedHero.weapon.name} />
                    <div className="weapon-info">
                      <h4>{selectedHero.weapon.name}</h4>
                      <p>{t('weaponLevel')}: {selectedHero.weapon.level} | {t('weaponStars')}: {'⭐'.repeat(selectedHero.weapon.star)}</p>
                      <p className="weapon-talent">
                        <strong>{selectedHero.weapon.talent_title}:</strong> {selectedHero.weapon.talent_content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedHero.equip && selectedHero.equip.length > 0 && (
                <div className="hero-equipment">
                  <h3>{t('heroEquipment')}</h3>
                  <div className="equipment-grid">
                    {selectedHero.equip.map((item, index) => (
                      <div key={index} className="equipment-card">
                        <img src={item.icon} alt={item.name} />
                        <div className="equipment-info">
                          <h4>{item.name}</h4>
                          <p>{t('equipmentLevel')}: {item.level} | {t('equipmentSlot')}: {item.equipment_type}</p>
                          {item.suit_name && (
                            <div className="equipment-set">
                              <strong>{item.suit_name}</strong> ({item.suit_own}/6)
                              {item.suit_desc1 && <p className="set-bonus">{item.suit_desc1}</p>}
                              {item.suit_desc2 && item.suit_own >= 4 && (
                                <p className="set-bonus">{item.suit_desc2}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Heroes
