import React, { useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from '../hooks/useTranslation'

const Profile = () => {
  const { user, updateAvatar, deleteAvatar } = useAuthStore()
  const { t } = useTranslation()
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Проверка размера файла (макс 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 2MB')
        return
      }

      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение')
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result
        const result = await updateAvatar(base64String)
        if (!result.success) {
          alert(result.error || 'Не удалось загрузить аватар')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = async () => {
    const result = await deleteAvatar()
    if (!result.success) {
      alert(result.error || 'Не удалось удалить аватар')
    }
  }

  const getInitials = (username) => {
    if (!username) return 'U'
    return username.charAt(0).toUpperCase()
  }

  if (!user) return <div className="loading">{t('loading')}</div>

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Левая колонка - Аватар и основная информация */}
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="profile-avatar-image" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(user.username)}
                </div>
              )}
              <button className="avatar-edit-btn" onClick={handleAvatarClick} title="Изменить аватар">
                📷
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {user.avatar && (
              <button className="btn-remove-avatar" onClick={handleRemoveAvatar}>
                {t('delete')} {t('avatar') || 'аватар'}
              </button>
            )}
          </div>

          <div className="profile-user-info">
            <h1 className="profile-username">{user.username}</h1>
            <div className="profile-role-badge">{user.role || 'player'}</div>
            <div className="profile-email">{user.email}</div>
            <div className="profile-joined">
              {t('memberSince') || 'Участник с'}: {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="profile-rating-card">
            <div className="rating-label">{t('rating')}</div>
            <div className="rating-value">{user.rating || 1000}</div>
          </div>
        </div>

        {/* Правая колонка - Статистика */}
        <div className="profile-main">
          <div className="profile-section">
            <h2>{t('statistics')}</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎮</div>
                <div className="stat-info">
                  <div className="stat-value">{user.total_matches || 0}</div>
                  <div className="stat-label">{t('totalMatches')}</div>
                </div>
              </div>

              <div className="stat-card stat-wins">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-value">{user.wins || 0}</div>
                  <div className="stat-label">{t('wins')}</div>
                </div>
              </div>

              <div className="stat-card stat-losses">
                <div className="stat-icon">💔</div>
                <div className="stat-info">
                  <div className="stat-value">{user.losses || 0}</div>
                  <div className="stat-label">{t('losses')}</div>
                </div>
              </div>

              <div className="stat-card stat-winrate">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-value">
                    {user.total_matches > 0
                      ? ((user.wins / user.total_matches) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="stat-label">{t('winRate')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>{t('matchHistory')}</h2>
            <div className="match-history-placeholder">
              <p>{t('noMatchHistory') || 'История матчей пока пуста'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
