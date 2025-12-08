package models

import (
	"time"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleUser      UserRole = "user"
	RoleModerator UserRole = "moderator"
	RoleAdmin     UserRole = "admin"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Username     string   `gorm:"unique;not null" json:"username"`
	Email        string   `gorm:"unique;not null" json:"email"`
	PasswordHash string   `gorm:"not null" json:"-"`
	Role         UserRole `gorm:"default:'user'" json:"role"`
	Avatar       string   `gorm:"type:text" json:"avatar,omitempty"` // Base64 encoded image

	// Статистика игрока
	Rating       int     `gorm:"default:1000" json:"rating"`
	Wins         int     `gorm:"default:0" json:"wins"`
	Losses       int     `gorm:"default:0" json:"losses"`
	TotalMatches int     `gorm:"default:0" json:"total_matches"`

	// Отношения
	Tournaments []Tournament `gorm:"many2many:tournament_participants;" json:"tournaments,omitempty"`
	Messages    []Message    `json:"messages,omitempty"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
