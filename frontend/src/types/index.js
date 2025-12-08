// User types
export const UserRole = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
}

// Tournament types
export const TournamentType = {
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
}

export const TournamentStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// Room types
export const RoomStatus = {
  WAITING: 'waiting',
  READY: 'ready',
  IN_GAME: 'in_game',
  COMPLETED: 'completed',
}

// Hero types
export const HeroElement = {
  PHYSICAL: 'physical',
  FIRE: 'fire',
  ICE: 'ice',
  ELECTRIC: 'electric',
  ETHER: 'ether',
}

export const HeroRole = {
  ATTACKER: 'attacker',
  DEFENSE: 'defense',
  SUPPORT: 'support',
  STUN: 'stun',
}

// Message types
export const MessageType = {
  TEXT: 'text',
  SYSTEM: 'system',
  JOIN: 'join',
  LEAVE: 'leave',
}
