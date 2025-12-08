package handlers

import (
	"net/http"
	"strconv"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/models"
	"github.com/Dimanchick22/ProxyLeague/internal/tournament"
	"github.com/gin-gonic/gin"
)

type TournamentHandler struct{}

func NewTournamentHandler() *TournamentHandler {
	return &TournamentHandler{}
}

func (h *TournamentHandler) CreateTournament(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.CreateTournamentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	t := models.Tournament{
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Status:      models.StatusPending,
		MaxPlayers:  req.MaxPlayers,
		CreatorID:   userID.(uint),
	}

	if err := database.DB.Create(&t).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tournament"})
		return
	}

	c.JSON(http.StatusCreated, t)
}

func (h *TournamentHandler) GetTournaments(c *gin.Context) {
	var tournaments []models.Tournament

	query := database.DB.Preload("Creator").Preload("Participants")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&tournaments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tournaments"})
		return
	}

	c.JSON(http.StatusOK, tournaments)
}

func (h *TournamentHandler) GetTournament(c *gin.Context) {
	id := c.Param("id")

	var t models.Tournament
	if err := database.DB.Preload("Creator").Preload("Participants").Preload("Matches.Player1").Preload("Matches.Player2").Preload("Matches.Winner").First(&t, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tournament not found"})
		return
	}

	c.JSON(http.StatusOK, t)
}

func (h *TournamentHandler) JoinTournament(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var t models.Tournament
	if err := database.DB.Preload("Participants").First(&t, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tournament not found"})
		return
	}

	if t.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tournament already started or completed"})
		return
	}

	if len(t.Participants) >= t.MaxPlayers {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tournament is full"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := database.DB.Model(&t).Association("Participants").Append(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join tournament"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined tournament"})
}

func (h *TournamentHandler) StartTournament(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var t models.Tournament
	if err := database.DB.Preload("Participants").First(&t, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tournament not found"})
		return
	}

	if t.CreatorID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only tournament creator can start it"})
		return
	}

	if t.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tournament already started"})
		return
	}

	if len(t.Participants) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough participants"})
		return
	}

	var matches []models.Match
	var err error

	switch t.Type {
	case models.TypeSingleElimination:
		matches, err = tournament.GenerateSingleEliminationBracket(&t)
	case models.TypeDoubleElimination:
		matches, err = tournament.GenerateDoubleEliminationBracket(&t)
	case models.TypeRoundRobin:
		matches, err = tournament.GenerateRoundRobinBracket(&t)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tournament type"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate bracket"})
		return
	}

	if err := database.DB.Create(&matches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create matches"})
		return
	}

	t.Status = models.StatusInProgress
	if err := database.DB.Save(&t).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tournament status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tournament started", "matches": matches})
}

func (h *TournamentHandler) UpdateMatchResult(c *gin.Context) {
	matchID, _ := strconv.Atoi(c.Param("matchId"))

	var req struct {
		WinnerID uint `json:"winner_id" binding:"required"`
		Score1   int  `json:"score1"`
		Score2   int  `json:"score2"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var match models.Match
	if err := database.DB.First(&match, matchID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}

	if req.WinnerID != match.Player1ID && req.WinnerID != match.Player2ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid winner ID"})
		return
	}

	match.WinnerID = &req.WinnerID
	match.Score1 = req.Score1
	match.Score2 = req.Score2

	if err := database.DB.Save(&match).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update match"})
		return
	}

	c.JSON(http.StatusOK, match)
}
