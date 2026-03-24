package services

import (
	"log"
	"time"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/models"
)

const afkThreshold = 30 * time.Minute
const cleanupInterval = 5 * time.Minute

// StartRoomCleanup запускает фоновую горутину, закрывающую лобби с AFK-хостом.
func StartRoomCleanup() {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	log.Println("Room AFK cleanup service started")
	for range ticker.C {
		cleanupAFKRooms()
	}
}

func cleanupAFKRooms() {
	threshold := time.Now().Add(-afkThreshold)

	result := database.DB.Model(&models.Room{}).
		Where(
			"status NOT IN ? AND host_last_seen_at IS NOT NULL AND host_last_seen_at < ?",
			[]models.RoomStatus{models.RoomStatusCompleted, models.RoomStatusInGame},
			threshold,
		).
		Update("status", models.RoomStatusCompleted)

	if result.Error != nil {
		log.Printf("AFK cleanup error: %v", result.Error)
		return
	}
	if result.RowsAffected > 0 {
		log.Printf("AFK cleanup: closed %d room(s)", result.RowsAffected)
	}
}
