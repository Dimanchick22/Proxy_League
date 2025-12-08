package database

import (
	"fmt"
	"log"

	"github.com/Dimanchick22/ProxyLeague/internal/models"
	"github.com/Dimanchick22/ProxyLeague/pkg/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established")
	return nil
}

func Migrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Tournament{},
		&models.Match{},
		&models.Hero{},
		&models.Room{},
		&models.Message{},
		&models.UserGameProfile{},
		&models.UserHero{},
		&models.UserEquipment{},
		&models.UserWeapon{},
		&models.UserSkill{},
		&models.UserRank{},
	)

	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func SeedHeroes() error {
	var count int64
	DB.Model(&models.Hero{}).Count(&count)
	if count > 0 {
		log.Println("Heroes already seeded, skipping...")
		return nil
	}

	log.Println("Seeding heroes...")

	heroes := []models.Hero{
		{Name: "Ellen Joe", Element: models.ElementIce, Role: models.RoleAttacker, Rarity: 5, HP: 8500, Attack: 850, Defense: 620},
		{Name: "Zhu Yuan", Element: models.ElementEther, Role: models.RoleAttacker, Rarity: 5, HP: 8200, Attack: 890, Defense: 580},
		{Name: "Jane Doe", Element: models.ElementPhysical, Role: models.RoleAttacker, Rarity: 5, HP: 8300, Attack: 870, Defense: 600},
		{Name: "Qingyi", Element: models.ElementElectric, Role: models.RoleStun, Rarity: 5, HP: 9000, Attack: 720, Defense: 680},
		{Name: "Koleda", Element: models.ElementFire, Role: models.RoleStun, Rarity: 5, HP: 9200, Attack: 700, Defense: 700},
		{Name: "Lycaon", Element: models.ElementIce, Role: models.RoleStun, Rarity: 5, HP: 9100, Attack: 710, Defense: 690},
		{Name: "Grace Howard", Element: models.ElementElectric, Role: models.RoleAttacker, Rarity: 5, HP: 8400, Attack: 860, Defense: 590},
		{Name: "Rina", Element: models.ElementElectric, Role: models.RoleSupport, Rarity: 5, HP: 8800, Attack: 650, Defense: 650},

		{Name: "Anby Demara", Element: models.ElementElectric, Role: models.RoleStun, Rarity: 4, HP: 8500, Attack: 680, Defense: 640},
		{Name: "Nicole Demara", Element: models.ElementEther, Role: models.RoleSupport, Rarity: 4, HP: 8200, Attack: 620, Defense: 630},
		{Name: "Billy Kid", Element: models.ElementPhysical, Role: models.RoleAttacker, Rarity: 4, HP: 7800, Attack: 820, Defense: 560},
		{Name: "Corin Wickes", Element: models.ElementPhysical, Role: models.RoleAttacker, Rarity: 4, HP: 7900, Attack: 810, Defense: 570},
		{Name: "Nekomata", Element: models.ElementPhysical, Role: models.RoleAttacker, Rarity: 4, HP: 7700, Attack: 830, Defense: 550},
		{Name: "Piper", Element: models.ElementPhysical, Role: models.RoleAttacker, Rarity: 4, HP: 8000, Attack: 800, Defense: 580},
		{Name: "Anton Ivanov", Element: models.ElementElectric, Role: models.RoleAttacker, Rarity: 4, HP: 8100, Attack: 790, Defense: 590},
		{Name: "Ben Bigger", Element: models.ElementFire, Role: models.RoleDefense, Rarity: 4, HP: 9500, Attack: 600, Defense: 750},
		{Name: "Lucy", Element: models.ElementFire, Role: models.RoleSupport, Rarity: 4, HP: 8300, Attack: 630, Defense: 620},
		{Name: "Soukaku", Element: models.ElementIce, Role: models.RoleSupport, Rarity: 4, HP: 8400, Attack: 640, Defense: 610},
	}

	result := DB.Create(&heroes)
	if result.Error != nil {
		return fmt.Errorf("failed to seed heroes: %w", result.Error)
	}

	log.Printf("Successfully seeded %d heroes", len(heroes))
	return nil
}
