package models

import (
	"time"
	"gorm.io/gorm"
)

type RoomStatus string

const (
	RoomStatusWaiting   RoomStatus = "waiting"
	RoomStatusReady     RoomStatus = "ready"
	RoomStatusInGame    RoomStatus = "in_game"
	RoomStatusCompleted RoomStatus = "completed"
)

type Room struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string     `gorm:"not null" json:"name"`
	Description string     `json:"description"`
	Status      RoomStatus `gorm:"default:'waiting'" json:"status"`
	MaxPlayers  int        `gorm:"default:2" json:"max_players"`
	Password    string     `json:"-"` // Опциональный пароль для приватных комнат
	IsPrivate   bool       `gorm:"default:false" json:"is_private"`

	// Создатель комнаты (хост)
	HostID          uint       `json:"host_id"`
	Host            User       `gorm:"foreignKey:HostID" json:"host,omitempty"`
	HostLastSeenAt  *time.Time `json:"host_last_seen_at,omitempty"` // для отслеживания AFK

	// Участники комнаты
	Participants []User `gorm:"many2many:room_participants;" json:"participants,omitempty"`

	// Связь с турниром (если комната создана для турнирного матча)
	TournamentID *uint       `json:"tournament_id"`
	Tournament   *Tournament `gorm:"foreignKey:TournamentID" json:"tournament,omitempty"`
}

type CreateRoomRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	MaxPlayers  int    `json:"max_players" binding:"required,min=2,max=10"`
	Password    string `json:"password"`
	IsPrivate   bool   `json:"is_private"`
}

type JoinRoomRequest struct {
	RoomID   uint   `json:"room_id" binding:"required"`
	Password string `json:"password"`
}
