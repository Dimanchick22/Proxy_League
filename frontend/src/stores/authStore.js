import { create } from 'zustand'
import { authAPI } from '../services/api'
import websocketService from '../services/websocket'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Инициализация WebSocket при загрузке, если есть токен
  init: () => {
    const token = localStorage.getItem('token')
    if (token && !websocketService.ws) {
      websocketService.connect(token)
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      set({ user, token, isAuthenticated: true, isLoading: false })

      // Подключаемся к WebSocket после авторизации
      websocketService.connect(token)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.register(data)
      const { token, user } = response.data

      localStorage.setItem('token', token)
      set({ user, token, isAuthenticated: true, isLoading: false })

      // Подключаемся к WebSocket после регистрации
      websocketService.connect(token)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    websocketService.disconnect()
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchProfile: async () => {
    try {
      const response = await authAPI.getProfile()
      set({ user: response.data })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      get().logout()
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data)
      set({ user: response.data })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed'
      return { success: false, error: message }
    }
  },

  updateAvatar: async (avatarData) => {
    try {
      const response = await authAPI.updateAvatar(avatarData)
      set({ user: response.data })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update avatar'
      return { success: false, error: message }
    }
  },

  deleteAvatar: async () => {
    try {
      const response = await authAPI.deleteAvatar()
      set({ user: response.data })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete avatar'
      return { success: false, error: message }
    }
  },
}))
