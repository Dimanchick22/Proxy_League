import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useThemeStore } from '../stores/themeStore'
import { useTranslation } from '../hooks/useTranslation'

const Register = () => {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Очистить предыдущие ошибки
    const newErrors = { username: '', email: '', password: '', confirmPassword: '' }

    // Валидация на клиенте
    if (formData.username.length < 3) {
      newErrors.username = t('usernameTaken')
      setErrors(newErrors)
      return
    }

    if (formData.password.length < 6) {
      newErrors.password = t('passwordTooShort')
      setErrors(newErrors)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch')
      setErrors(newErrors)
      return
    }

    setErrors(newErrors)

    const { confirmPassword, ...data } = formData
    const result = await register(data)

    if (result.success) {
      navigate('/')
    } else {
      // Показать ошибку под конкретным полем
      const errorMsg = (result.error || '').toLowerCase()

      if (errorMsg.includes('email') && (errorMsg.includes('exist') || errorMsg.includes('already') || errorMsg.includes('taken'))) {
        setErrors({ ...newErrors, email: t('emailAlreadyExists') })
      } else if (errorMsg.includes('username') && (errorMsg.includes('exist') || errorMsg.includes('already') || errorMsg.includes('taken'))) {
        setErrors({ ...newErrors, username: t('usernameTaken') })
      } else {
        // Общая ошибка - показываем под email
        setErrors({ ...newErrors, email: t('registrationFailed') })
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
        <h2>{t('registerTitle')}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              placeholder={t('username')}
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

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
              minLength="6"
              placeholder="••••••••"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>{t('confirmPassword')}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? t('loading') : t('signUp')}
          </button>
        </form>

        <p className="auth-link">
          {t('alreadyHaveAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
