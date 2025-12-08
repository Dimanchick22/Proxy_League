package models

import (
	"time"
	"gorm.io/gorm"
)

type HeroElement string
type HeroRole string

const (
	ElementPhysical HeroElement = "physical"
	ElementFire     HeroElement = "fire"
	ElementIce      HeroElement = "ice"
	ElementElectric HeroElement = "electric"
	ElementEther    HeroElement = "ether"

	RoleAttacker HeroRole = "attacker"
	RoleDefense  HeroRole = "defense"
	RoleSupport  HeroRole = "support"
	RoleStun     HeroRole = "stun"
)

type Hero struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string      `gorm:"unique;not null" json:"name"`
	Element     HeroElement `gorm:"not null" json:"element"`
	Role        HeroRole    `gorm:"not null" json:"role"`
	Rarity      int         `gorm:"not null" json:"rarity"` // S-ранг = 5, A-ранг = 4
	Description string      `json:"description"`
	ImageURL    string      `json:"image_url"`

	// Базовые характеристики
	HP      int `json:"hp"`
	Attack  int `json:"attack"`
	Defense int `json:"defense"`

	// Статистика использования
	PickRate float64 `gorm:"default:0" json:"pick_rate"`
	WinRate  float64 `gorm:"default:0" json:"win_rate"`
	BanRate  float64 `gorm:"default:0" json:"ban_rate"`
}

type HeroStats struct {
	HeroID       uint    `json:"hero_id"`
	TotalPicks   int     `json:"total_picks"`
	TotalWins    int     `json:"total_wins"`
	TotalMatches int     `json:"total_matches"`
	PickRate     float64 `json:"pick_rate"`
	WinRate      float64 `json:"win_rate"`
}
