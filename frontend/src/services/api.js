import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  updateAvatar: (avatarData) => api.put('/avatar', { avatar: avatarData }),
  deleteAvatar: () => api.delete('/avatar'),
}

// Tournament API
export const tournamentAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  join: (id) => api.post(`/tournaments/${id}/join`),
  start: (id) => api.post(`/tournaments/${id}/start`),
  updateMatch: (tournamentId, matchId, data) =>
    api.put(`/tournaments/${tournamentId}/matches/${matchId}`, data),
}

// Room API
export const roomAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  join: (data) => api.post('/rooms/join', data),
  leave: (id) => api.post(`/rooms/${id}/leave`),
  delete: (id) => api.delete(`/rooms/${id}`),
}

// Hero API
export const heroAPI = {
  getAll: (params) => api.get('/heroes', { params }),
  getById: (id) => api.get(`/heroes/${id}`),
  getStats: (id) => api.get(`/heroes/${id}/stats`),
  getTop: (params) => api.get('/heroes/top', { params }),
}

// User Hero API (персональные герои пользователя)
export const userHeroAPI = {
  fetchHeroes: (data, config) => api.post('/user-heroes/fetch', data, config),
  getAll: () => api.get('/user-heroes'),
  getById: (id) => api.get(`/user-heroes/${id}`),
  deleteAll: () => api.delete('/user-heroes'),
}

// Game Profile API
export const gameProfileAPI = {
  get: () => api.get('/game-profile'),
  update: (data) => api.put('/game-profile', data),
}

// Game Match API
export const gameAPI = {
  startGame: (roomId) => api.post(`/rooms/${roomId}/game/start`),
  getMatch: (roomId) => api.get(`/rooms/${roomId}/game`),
  submitCharacters: (roomId, characterIds) =>
    api.post(`/rooms/${roomId}/game/characters`, { character_ids: characterIds }),
  submitStageTime: (roomId, stage, timeSeconds) =>
    api.post(`/rooms/${roomId}/game/stage-time`, { stage, time_seconds: timeSeconds }),
}

// WebSocket API
export const wsAPI = {
  getOnlineUsers: () => api.get('/online'),
}

export default api
