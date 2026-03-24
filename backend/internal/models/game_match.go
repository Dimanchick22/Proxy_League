package models

import (
	"time"

	"gorm.io/gorm"
)

type GameMatchStatus string

const (
	GameMatchStatusCharacterSelection GameMatchStatus = "character_selection"
	GameMatchStatusInProgress         GameMatchStatus = "in_progress"
	GameMatchStatusStage2Input        GameMatchStatus = "stage2_input"
	GameMatchStatusCompleted          GameMatchStatus = "completed"
)

// GameMatch - игровой матч между двумя игроками в комнате
type GameMatch struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	RoomID    uint `gorm:"not null;index" json:"room_id"`
	Player1ID uint `gorm:"not null" json:"player1_id"`
	Player2ID uint `gorm:"not null" json:"player2_id"`

	Status    GameMatchStatus `gorm:"default:'character_selection'" json:"status"`
	StartTime *time.Time      `json:"start_time"`

	// Выбранные персонажи (JSON-массив UserHero IDs)
	Player1Characters string `gorm:"type:text;default:'[]'" json:"player1_characters"`
	Player2Characters string `gorm:"type:text;default:'[]'" json:"player2_characters"`

	// Времена прохождения этапов в секундах (0 = не отправлено)
	Player1Stage1Time float64 `gorm:"default:0" json:"player1_stage1_time"`
	Player1Stage2Time float64 `gorm:"default:0" json:"player1_stage2_time"`
	Player2Stage1Time float64 `gorm:"default:0" json:"player2_stage1_time"`
	Player2Stage2Time float64 `gorm:"default:0" json:"player2_stage2_time"`

	// Результаты
	WinnerID         *uint `json:"winner_id"`
	Player1EloChange int   `gorm:"default:0" json:"player1_elo_change"`
	Player2EloChange int   `gorm:"default:0" json:"player2_elo_change"`

	// Связи
	Player1 User  `gorm:"foreignKey:Player1ID" json:"player1,omitempty"`
	Player2 User  `gorm:"foreignKey:Player2ID" json:"player2,omitempty"`
	Winner  *User `gorm:"foreignKey:WinnerID" json:"winner,omitempty"`
}

// SubmitCharactersRequest - запрос на выбор персонажей
type SubmitCharactersRequest struct {
	CharacterIDs []uint `json:"character_ids" binding:"required"`
}

// SubmitStageTimeRequest - запрос на отправку времени этапа
type SubmitStageTimeRequest struct {
	Stage       int     `json:"stage" binding:"required,min=1,max=2"`
	TimeSeconds float64 `json:"time_seconds" binding:"required,min=1"`
}
