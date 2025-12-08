package models

import (
	"time"
	"gorm.io/gorm"
)

type MessageType string

const (
	MessageTypeText   MessageType = "text"
	MessageTypeSystem MessageType = "system"
	MessageTypeJoin   MessageType = "join"
	MessageTypeLeave  MessageType = "leave"
)

type Message struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Content string      `gorm:"not null" json:"content"`
	Type    MessageType `gorm:"default:'text'" json:"type"`

	// Автор сообщения
	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Комната, в которой отправлено сообщение
	RoomID *uint `json:"room_id"`
	Room   *Room `gorm:"foreignKey:RoomID" json:"room,omitempty"`

	// Флаги модерации
	IsDeleted bool `gorm:"default:false" json:"is_deleted"`
	IsEdited  bool `gorm:"default:false" json:"is_edited"`
}

type SendMessageRequest struct {
	Content string `json:"content" binding:"required,max=500"`
	RoomID  *uint  `json:"room_id"`
}

type MessageResponse struct {
	ID        uint        `json:"id"`
	Content   string      `json:"content"`
	Type      MessageType `json:"type"`
	UserID    uint        `json:"user_id"`
	Username  string      `json:"username"`
	RoomID    *uint       `json:"room_id"`
	CreatedAt time.Time   `json:"created_at"`
	IsEdited  bool        `json:"is_edited"`
}
