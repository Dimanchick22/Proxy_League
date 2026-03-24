package handlers

import (
	"net/http"
	"time"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type RoomHandler struct{}

func NewRoomHandler() *RoomHandler {
	return &RoomHandler{}
}

func (h *RoomHandler) CreateRoom(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверка: у пользователя может быть только одно активное лобби
	var existingRoom models.Room
	if err := database.DB.Where(
		"host_id = ? AND status NOT IN ?",
		userID,
		[]models.RoomStatus{models.RoomStatusCompleted},
	).First(&existingRoom).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have an active room"})
		return
	}

	room := models.Room{
		Name:           req.Name,
		Description:    req.Description,
		MaxPlayers:     req.MaxPlayers,
		IsPrivate:      req.IsPrivate,
		HostID:         userID.(uint),
		Status:         models.RoomStatusWaiting,
		HostLastSeenAt: func() *time.Time { t := time.Now(); return &t }(),
	}

	if req.IsPrivate && req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		room.Password = string(hashedPassword)
	}

	if err := database.DB.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	var host models.User
	database.DB.First(&host, userID)
	database.DB.Model(&room).Association("Participants").Append(&host)

	c.JSON(http.StatusCreated, room)
}

func (h *RoomHandler) GetRooms(c *gin.Context) {
	var rooms []models.Room

	query := database.DB.Preload("Host").Preload("Participants")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

func (h *RoomHandler) GetRoom(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var room models.Room
	if err := database.DB.Preload("Host").Preload("Participants").First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Обновить время последней активности хоста
	if userID != nil && room.HostID == userID.(uint) {
		now := time.Now()
		database.DB.Model(&room).Update("host_last_seen_at", now)
	}

	c.JSON(http.StatusOK, room)
}

func (h *RoomHandler) JoinRoom(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.JoinRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var room models.Room
	if err := database.DB.Preload("Participants").First(&room, req.RoomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	if room.IsPrivate && room.Password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(room.Password), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
			return
		}
	}

	if len(room.Participants) >= room.MaxPlayers {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room is full"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := database.DB.Model(&room).Association("Participants").Append(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined room", "room": room})
}

func (h *RoomHandler) LeaveRoom(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var room models.Room
	if err := database.DB.First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	var user models.User
	database.DB.First(&user, userID)

	if err := database.DB.Model(&room).Association("Participants").Delete(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully left room"})
}

func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var room models.Room
	if err := database.DB.First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	if room.HostID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only host can delete the room"})
		return
	}

	if err := database.DB.Delete(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully"})
}
