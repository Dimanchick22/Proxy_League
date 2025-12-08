package models

import (
	"time"
	"gorm.io/gorm"
)

type TournamentType string
type TournamentStatus string

const (
	TypeSingleElimination TournamentType = "single_elimination"
	TypeDoubleElimination TournamentType = "double_elimination"
	TypeRoundRobin        TournamentType = "round_robin"

	StatusPending   TournamentStatus = "pending"
	StatusInProgress TournamentStatus = "in_progress"
	StatusCompleted  TournamentStatus = "completed"
	StatusCancelled  TournamentStatus = "cancelled"
)

type Tournament struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string           `gorm:"not null" json:"name"`
	Description string           `json:"description"`
	Type        TournamentType   `gorm:"not null" json:"type"`
	Status      TournamentStatus `gorm:"default:'pending'" json:"status"`
	MaxPlayers  int              `gorm:"default:8" json:"max_players"`
	StartDate   *time.Time       `json:"start_date"`
	EndDate     *time.Time       `json:"end_date"`

	// Создатель турнира
	CreatorID uint `json:"creator_id"`
	Creator   User `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`

	// Участники
	Participants []User `gorm:"many2many:tournament_participants;" json:"participants,omitempty"`

	// Матчи
	Matches []Match `json:"matches,omitempty"`
}

type Match struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	TournamentID uint       `json:"tournament_id"`
	Tournament   Tournament `gorm:"foreignKey:TournamentID" json:"tournament,omitempty"`

	Round  int    `json:"round"`
	Player1ID uint `json:"player1_id"`
	Player2ID uint `json:"player2_id"`
	WinnerID  *uint `json:"winner_id"`

	Player1 User  `gorm:"foreignKey:Player1ID" json:"player1,omitempty"`
	Player2 User  `gorm:"foreignKey:Player2ID" json:"player2,omitempty"`
	Winner  *User `gorm:"foreignKey:WinnerID" json:"winner,omitempty"`

	Score1 int  `json:"score1"`
	Score2 int  `json:"score2"`
	IsBye  bool `gorm:"default:false" json:"is_bye"`
}

type CreateTournamentRequest struct {
	Name        string         `json:"name" binding:"required"`
	Description string         `json:"description"`
	Type        TournamentType `json:"type" binding:"required"`
	MaxPlayers  int            `json:"max_players" binding:"required,min=2,max=16"`
}
