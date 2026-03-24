package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/models"
	"github.com/Dimanchick22/ProxyLeague/internal/services"
	"github.com/gin-gonic/gin"
)

type GameMatchHandler struct{}

func NewGameMatchHandler() *GameMatchHandler {
	return &GameMatchHandler{}
}

// StartGame - хост запускает игру в комнате (создаёт GameMatch)
func (h *GameMatchHandler) StartGame(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	var room models.Room
	if err := database.DB.Preload("Participants").First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	if room.HostID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only host can start the game"})
		return
	}

	if len(room.Participants) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Need at least 2 players to start"})
		return
	}

	if room.Status == models.RoomStatusInGame {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Game already in progress"})
		return
	}

	// Найти двух участников (хост = player1, второй = player2)
	var player1ID, player2ID uint
	for _, p := range room.Participants {
		if p.ID == room.HostID {
			player1ID = p.ID
		} else {
			player2ID = p.ID
		}
	}
	if player2ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot find second player"})
		return
	}

	// Проверить нет ли уже активного матча
	var existing models.GameMatch
	if err := database.DB.Where("room_id = ? AND status != ?", roomID, models.GameMatchStatusCompleted).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Active match already exists"})
		return
	}

	match := models.GameMatch{
		RoomID:            room.ID,
		Player1ID:         player1ID,
		Player2ID:         player2ID,
		Status:            models.GameMatchStatusCharacterSelection,
		Player1Characters: "[]",
		Player2Characters: "[]",
	}

	if err := database.DB.Create(&match).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create game match"})
		return
	}

	// Обновить статус комнаты
	database.DB.Model(&room).Update("status", models.RoomStatusInGame)

	database.DB.Preload("Player1").Preload("Player2").First(&match, match.ID)
	c.JSON(http.StatusCreated, match)
}

// GetCurrentMatch - получить текущий активный матч комнаты
func (h *GameMatchHandler) GetCurrentMatch(c *gin.Context) {
	roomID := c.Param("id")

	var match models.GameMatch
	if err := database.DB.
		Preload("Player1").
		Preload("Player2").
		Preload("Winner").
		Where("room_id = ?", roomID).
		Order("created_at DESC").
		First(&match).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No match found"})
		return
	}

	c.JSON(http.StatusOK, match)
}

// SubmitCharacters - игрок выбирает 3 персонажа
func (h *GameMatchHandler) SubmitCharacters(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	var req models.SubmitCharactersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.CharacterIDs) != 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Must select exactly 3 characters"})
		return
	}

	var match models.GameMatch
	if err := database.DB.Where("room_id = ? AND status = ?", roomID, models.GameMatchStatusCharacterSelection).First(&match).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active character selection phase"})
		return
	}

	uid := userID.(uint)
	if uid != match.Player1ID && uid != match.Player2ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a participant of this match"})
		return
	}

	// Проверить, что персонажи принадлежат игроку
	var heroCount int64
	database.DB.Model(&models.UserHero{}).
		Where("user_id = ? AND id IN ?", uid, req.CharacterIDs).
		Count(&heroCount)
	if int(heroCount) != len(req.CharacterIDs) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Some characters do not belong to you"})
		return
	}

	charsJSON, _ := json.Marshal(req.CharacterIDs)

	if uid == match.Player1ID {
		database.DB.Model(&match).Update("player1_characters", string(charsJSON))
	} else {
		database.DB.Model(&match).Update("player2_characters", string(charsJSON))
	}

	// Перечитать матч после обновления
	database.DB.First(&match, match.ID)

	// Если оба выбрали — перейти в in_progress
	var p1Chars, p2Chars []uint
	json.Unmarshal([]byte(match.Player1Characters), &p1Chars)
	json.Unmarshal([]byte(match.Player2Characters), &p2Chars)

	if len(p1Chars) == 3 && len(p2Chars) == 3 {
		now := time.Now()
		database.DB.Model(&match).Updates(map[string]interface{}{
			"status":     models.GameMatchStatusInProgress,
			"start_time": now,
		})
	}

	database.DB.Preload("Player1").Preload("Player2").First(&match, match.ID)
	c.JSON(http.StatusOK, match)
}

// SubmitStageTime - игрок отправляет время прохождения этапа
func (h *GameMatchHandler) SubmitStageTime(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	var req models.SubmitStageTimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var match models.GameMatch
	if err := database.DB.
		Where("room_id = ? AND status IN ?", roomID, []models.GameMatchStatus{
			models.GameMatchStatusInProgress,
			models.GameMatchStatusStage2Input,
		}).
		First(&match).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active match in progress"})
		return
	}

	uid := userID.(uint)
	if uid != match.Player1ID && uid != match.Player2ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a participant of this match"})
		return
	}

	isPlayer1 := uid == match.Player1ID

	// Записать время в нужное поле
	if req.Stage == 1 {
		if isPlayer1 {
			if match.Player1Stage1Time > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Stage 1 time already submitted"})
				return
			}
			database.DB.Model(&match).Update("player1_stage1_time", req.TimeSeconds)
		} else {
			if match.Player2Stage1Time > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Stage 1 time already submitted"})
				return
			}
			database.DB.Model(&match).Update("player2_stage1_time", req.TimeSeconds)
		}
	} else {
		if isPlayer1 {
			if match.Player1Stage2Time > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Stage 2 time already submitted"})
				return
			}
			database.DB.Model(&match).Update("player1_stage2_time", req.TimeSeconds)
		} else {
			if match.Player2Stage2Time > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Stage 2 time already submitted"})
				return
			}
			database.DB.Model(&match).Update("player2_stage2_time", req.TimeSeconds)
		}
	}

	// Перечитать после обновления
	database.DB.First(&match, match.ID)

	// Проверить переход фазы и завершение
	if match.Player1Stage1Time > 0 && match.Player2Stage1Time > 0 && match.Status == models.GameMatchStatusInProgress {
		database.DB.Model(&match).Update("status", models.GameMatchStatusStage2Input)
		match.Status = models.GameMatchStatusStage2Input
	}

	if match.Player1Stage2Time > 0 && match.Player2Stage2Time > 0 && match.Status == models.GameMatchStatusStage2Input {
		h.finishMatch(c, &match)
		return
	}

	database.DB.Preload("Player1").Preload("Player2").Preload("Winner").First(&match, match.ID)
	c.JSON(http.StatusOK, match)
}

// finishMatch - подсчёт итогов и обновление Elo
func (h *GameMatchHandler) finishMatch(c *gin.Context, match *models.GameMatch) {
	p1Total := match.Player1Stage1Time + match.Player1Stage2Time
	p2Total := match.Player2Stage1Time + match.Player2Stage2Time

	var winnerID uint
	var p1Won bool
	if p1Total < p2Total {
		winnerID = match.Player1ID
		p1Won = true
	} else if p2Total < p1Total {
		winnerID = match.Player2ID
		p1Won = false
	} else {
		// Ничья: нет победителя, изменений рейтинга нет
		database.DB.Model(match).Updates(map[string]interface{}{
			"status":    models.GameMatchStatusCompleted,
			"winner_id": nil,
		})
		database.DB.Preload("Player1").Preload("Player2").First(match, match.ID)
		c.JSON(http.StatusOK, match)
		return
	}

	var p1User, p2User models.User
	database.DB.First(&p1User, match.Player1ID)
	database.DB.First(&p2User, match.Player2ID)

	p1Change := services.CalculateElo(p1User.Rating, p2User.Rating, p1Won)
	p2Change := services.CalculateElo(p2User.Rating, p1User.Rating, !p1Won)

	// Обновить матч
	database.DB.Model(match).Updates(map[string]interface{}{
		"status":             models.GameMatchStatusCompleted,
		"winner_id":          winnerID,
		"player1_elo_change": p1Change,
		"player2_elo_change": p2Change,
	})

	// Обновить рейтинг и статистику игроков
	p1NewRating := p1User.Rating + p1Change
	if p1NewRating < 0 {
		p1NewRating = 0
	}
	p2NewRating := p2User.Rating + p2Change
	if p2NewRating < 0 {
		p2NewRating = 0
	}

	if p1Won {
		database.DB.Model(&p1User).Updates(map[string]interface{}{
			"rating":        p1NewRating,
			"wins":          p1User.Wins + 1,
			"total_matches": p1User.TotalMatches + 1,
		})
		database.DB.Model(&p2User).Updates(map[string]interface{}{
			"rating":        p2NewRating,
			"losses":        p2User.Losses + 1,
			"total_matches": p2User.TotalMatches + 1,
		})
	} else {
		database.DB.Model(&p2User).Updates(map[string]interface{}{
			"rating":        p2NewRating,
			"wins":          p2User.Wins + 1,
			"total_matches": p2User.TotalMatches + 1,
		})
		database.DB.Model(&p1User).Updates(map[string]interface{}{
			"rating":        p1NewRating,
			"losses":        p1User.Losses + 1,
			"total_matches": p1User.TotalMatches + 1,
		})
	}

	// Обновить статус комнаты
	database.DB.Model(&models.Room{}).Where("id = ?", match.RoomID).Update("status", models.RoomStatusCompleted)

	database.DB.Preload("Player1").Preload("Player2").Preload("Winner").First(match, match.ID)
	c.JSON(http.StatusOK, match)
}
