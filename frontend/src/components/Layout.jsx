import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useThemeStore } from '../stores/themeStore'
import { useTranslation } from '../hooks/useTranslation'

const Layout = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef(null)

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    navigate('/login')
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru')
  }

  const handleProfileClick = () => {
    setShowProfileMenu(false)
    navigate('/profile')
  }

  // Получить инициалы для аватарки
  const getInitials = (username) => {
    if (!username) return 'U'
    return username.charAt(0).toUpperCase()
  }

  // Получить аватарку пользователя
  const getUserAvatar = () => {
    return user?.avatar || null
  }

  // Закрыть меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  return (
    <div className="layout">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <h1>Proxy League</h1>
        </Link>

        <div className="navbar-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('dashboard')}
          </NavLink>
          <NavLink to="/tournaments" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('tournaments')}
          </NavLink>
          <NavLink to="/heroes" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('heroes')}
          </NavLink>
          <NavLink to="/rooms" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('rooms')}
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => isActive ? 'active' : ''}>
            {t('leaderboard')}
          </NavLink>
        </div>

        <div className="navbar-user">
          <button
            onClick={toggleTheme}
            className="btn-ghost"
            style={{ padding: '0.4rem 0.6rem', fontSize: '1rem' }}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={toggleLanguage}
            className="btn-ghost"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
          >
            {language === 'ru' ? '🇷🇺' : '🇬🇧'}
          </button>

          <div className="profile-dropdown" ref={menuRef}>
            <button
              className="profile-avatar"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {getUserAvatar() ? (
                <img src={getUserAvatar()} alt="Avatar" className="avatar-image" />
              ) : (
                getInitials(user?.username)
              )}
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <button onClick={handleProfileClick} className="profile-menu-item">
                  <span className="icon">👤</span>
                  {t('profile')}
                </button>
                <div className="profile-menu-divider" />
                <div className="profile-menu-info">
                  <div className="profile-menu-username">{user?.username}</div>
                  <div className="profile-menu-rating">{t('rating')}: {user?.rating || 1000}</div>
                </div>
                <div className="profile-menu-divider" />
                <button onClick={handleLogout} className="profile-menu-item logout-item">
                  <span className="icon">🚪</span>
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>&copy; 2024 Proxy League. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Layout
