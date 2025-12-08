package models

import (
	"time"

	"gorm.io/gorm"
)

// UserHero - персональный герой пользователя из ZZZ
type UserHero struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uint `gorm:"not null;index" json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"-"`

	// Данные из HoYoLAB API
	AvatarID          int    `gorm:"not null" json:"avatar_id"`          // ID героя в игре
	Level             int    `json:"level"`                              // Уровень героя
	Name              string `json:"name"`                               // Имя героя
	FullName          string `json:"full_name"`                          // Полное имя
	ElementType       int    `json:"element_type"`                       // Тип элемента
	CampName          string `json:"camp_name"`                          // Название лагеря/фракции
	AvatarProfession  int    `json:"avatar_profession"`                  // Профессия
	Rarity            string `json:"rarity"`                             // Редкость (S, A)
	GroupIconPath     string `json:"group_icon_path"`                    // URL иконки группы
	HollowIconPath    string `json:"hollow_icon_path"`                   // URL иконки hollow
	RoleVerticalURL   string `json:"role_vertical_painting_url"`         // URL вертикального изображения
	RoleSquareURL     string `json:"role_square_url"`                    // URL квадратного изображения
	VerticalColor     string `json:"vertical_painting_color"`            // Цвет
	Rank              int    `json:"rank"`                               // Ранг персонажа
	SubElementType    int    `json:"sub_element_type"`                   // Подтип элемента

	// Связи
	Equipment []UserEquipment `gorm:"foreignKey:UserHeroID" json:"equip,omitempty"`
	Weapon    *UserWeapon     `gorm:"foreignKey:UserHeroID" json:"weapon,omitempty"`
	Skills    []UserSkill     `gorm:"foreignKey:UserHeroID" json:"skills,omitempty"`
	Ranks     []UserRank      `gorm:"foreignKey:UserHeroID" json:"ranks,omitempty"`
}

// UserEquipment - экипировка (диски) героя
type UserEquipment struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserHeroID uint     `gorm:"not null;index" json:"-"`
	UserHero   UserHero `gorm:"foreignKey:UserHeroID" json:"-"`

	EquipID              int    `json:"id"`                       // ID экипировки
	Level                int    `json:"level"`                    // Уровень
	Name                 string `json:"name"`                     // Название
	Icon                 string `json:"icon"`                     // URL иконки
	Rarity               string `json:"rarity"`                   // Редкость
	EquipmentType        int    `json:"equipment_type"`           // Тип экипировки (1-6 слоты)
	InvalidPropertyCount int    `json:"invalid_property_cnt"`     // Количество неверных свойств
	AllHit               bool   `json:"all_hit"`                  // Все свойства попали

	// Сет экипировки
	SuitID   int    `json:"-"`
	SuitName string `json:"suit_name"`  // Название сета
	SuitOwn  int    `json:"suit_own"`   // Сколько предметов сета надето
	SuitDesc1 string `json:"suit_desc1"` // Описание бонуса 2 предметов
	SuitDesc2 string `json:"suit_desc2"` // Описание бонуса 4 предметов
}

// UserWeapon - оружие героя
type UserWeapon struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserHeroID uint     `gorm:"not null;index;unique" json:"-"`
	UserHero   UserHero `gorm:"foreignKey:UserHeroID" json:"-"`

	WeaponID       int    `json:"id"`              // ID оружия
	Level          int    `json:"level"`           // Уровень
	Name           string `json:"name"`            // Название
	Star           int    `json:"star"`            // Звезды
	Icon           string `json:"icon"`            // URL иконки
	Rarity         string `json:"rarity"`          // Редкость
	TalentTitle    string `json:"talent_title"`    // Название таланта
	TalentContent  string `json:"talent_content"`  // Описание таланта
	Profession     int    `json:"profession"`      // Профессия
}

// UserSkill - навык героя
type UserSkill struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserHeroID uint     `gorm:"not null;index" json:"-"`
	UserHero   UserHero `gorm:"foreignKey:UserHeroID" json:"-"`

	Level       int    `json:"level"`        // Уровень навыка
	SkillType   int    `json:"skill_type"`   // Тип навыка
	AwakenState string `json:"awaken_state"` // Состояние пробуждения
}

// UserRank - ранг (созвездие) героя
type UserRank struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserHeroID uint     `gorm:"not null;index" json:"-"`
	UserHero   UserHero `gorm:"foreignKey:UserHeroID" json:"-"`

	RankID     int    `json:"id"`           // ID ранга
	Name       string `json:"name"`         // Название
	Desc       string `json:"desc"`         // Описание
	Pos        int    `json:"pos"`          // Позиция (1-6)
	IsUnlocked bool   `json:"is_unlocked"`  // Разблокирован ли
}

// UserGameProfile - игровой профиль пользователя для хранения cookies и role_id
type UserGameProfile struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID uint `gorm:"unique;not null;index" json:"user_id"`
	User   User `gorm:"foreignKey:UserID" json:"-"`

	RoleID string `json:"role_id"` // Игровой ID (например: 1500008770)
	Server string `gorm:"default:'prod_gf_eu'" json:"server"` // Сервер (prod_gf_eu, prod_gf_us и т.д.)
}

// FetchUserHeroesRequest - запрос на получение героев пользователя
type FetchUserHeroesRequest struct {
	RoleID string `json:"role_id" binding:"required"`
	Server string `json:"server" binding:"required"`
}

// HoYoLabAvatarResponse - ответ от HoYoLAB API
type HoYoLabAvatarResponse struct {
	Retcode int    `json:"retcode"`
	Message string `json:"message"`
	Data    struct {
		AvatarList []HoYoLabAvatar `json:"avatar_list"`
	} `json:"data"`
}

// HoYoLabAvatar - данные героя от HoYoLAB API
type HoYoLabAvatar struct {
	ID                   int                 `json:"id"`
	Level                int                 `json:"level"`
	Name                 string              `json:"name_mi18n"`
	FullName             string              `json:"full_name_mi18n"`
	ElementType          int                 `json:"element_type"`
	CampName             string              `json:"camp_name_mi18n"`
	AvatarProfession     int                 `json:"avatar_profession"`
	Rarity               string              `json:"rarity"`
	GroupIconPath        string              `json:"group_icon_path"`
	HollowIconPath       string              `json:"hollow_icon_path"`
	RoleVerticalURL      string              `json:"role_vertical_painting_url"`
	RoleSquareURL        string              `json:"role_square_url"`
	VerticalColor        string              `json:"vertical_painting_color"`
	Rank                 int                 `json:"rank"`
	SubElementType       int                 `json:"sub_element_type"`
	Equip                []HoYoLabEquipment  `json:"equip"`
	Weapon               HoYoLabWeapon       `json:"weapon"`
	Skills               []HoYoLabSkill      `json:"skills"`
	Ranks                []HoYoLabRank       `json:"ranks"`
}

// HoYoLabEquipment - экипировка от HoYoLAB API
type HoYoLabEquipment struct {
	ID                   int    `json:"id"`
	Level                int    `json:"level"`
	Name                 string `json:"name"`
	Icon                 string `json:"icon"`
	Rarity               string `json:"rarity"`
	EquipmentType        int    `json:"equipment_type"`
	InvalidPropertyCount int    `json:"invalid_property_cnt"`
	AllHit               bool   `json:"all_hit"`
	EquipSuit            struct {
		SuitID int    `json:"suit_id"`
		Name   string `json:"name"`
		Own    int    `json:"own"`
		Desc1  string `json:"desc1"`
		Desc2  string `json:"desc2"`
	} `json:"equip_suit"`
}

// HoYoLabWeapon - оружие от HoYoLAB API
type HoYoLabWeapon struct {
	ID             int    `json:"id"`
	Level          int    `json:"level"`
	Name           string `json:"name"`
	Star           int    `json:"star"`
	Icon           string `json:"icon"`
	Rarity         string `json:"rarity"`
	TalentTitle    string `json:"talent_title"`
	TalentContent  string `json:"talent_content"`
	Profession     int    `json:"profession"`
}

// HoYoLabSkill - навык от HoYoLAB API
type HoYoLabSkill struct {
	Level       int    `json:"level"`
	SkillType   int    `json:"skill_type"`
	AwakenState string `json:"awaken_state"`
}

// HoYoLabRank - ранг от HoYoLAB API
type HoYoLabRank struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Desc       string `json:"desc"`
	Pos        int    `json:"pos"`
	IsUnlocked bool   `json:"is_unlocked"`
}
