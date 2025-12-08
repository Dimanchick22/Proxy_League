import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useThemeStore } from '../stores/themeStore'
import { useTranslation } from '../hooks/useTranslation'

const Login = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Очистить предыдущие ошибки
    setErrors({ email: '', password: '' })

    const result = await login(formData)
    if (result.success) {
      navigate('/')
    } else {
      // Показать ошибку в зависимости от типа
      const errorMsg = result.error || ''
      if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('not found')) {
        setErrors({ ...errors, email: t('invalidCredentials') })
      } else if (errorMsg.toLowerCase().includes('password')) {
        setErrors({ ...errors, password: t('invalidCredentials') })
      } else {
        // Общая ошибка - показываем под паролем
        setErrors({ ...errors, password: t('invalidCredentials') })
      }
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Очистить ошибку при вводе
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Proxy League</h1>
          <div className="auth-controls">
            <button
              onClick={toggleTheme}
              className="btn-ghost"
              style={{ padding: '0.5rem', fontSize: '1.2rem' }}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={toggleLanguage}
              className="btn-ghost"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              {language === 'ru' ? '🇷🇺' : '🇬🇧'}
            </button>
          </div>
        </div>
        <h2>{t('loginTitle')}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? t('loading') : t('signIn')}
          </button>
        </form>

        <p className="auth-link">
          {t('dontHaveAccount')} <Link to="/register">{t('signUp')}</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
