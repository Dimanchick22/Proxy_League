package handlers

import (
	"net/http"
	"strconv"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/models"
	"github.com/gin-gonic/gin"
)

type HeroHandler struct{}

func NewHeroHandler() *HeroHandler {
	return &HeroHandler{}
}

func (h *HeroHandler) GetHeroes(c *gin.Context) {
	var heroes []models.Hero

	query := database.DB

	if element := c.Query("element"); element != "" {
		query = query.Where("element = ?", element)
	}

	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	if rarity := c.Query("rarity"); rarity != "" {
		query = query.Where("rarity = ?", rarity)
	}

	sortBy := c.DefaultQuery("sort", "name")
	order := c.DefaultQuery("order", "asc")
	query = query.Order(sortBy + " " + order)

	if err := query.Find(&heroes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch heroes"})
		return
	}

	c.JSON(http.StatusOK, heroes)
}

func (h *HeroHandler) GetHero(c *gin.Context) {
	id := c.Param("id")

	var hero models.Hero
	if err := database.DB.First(&hero, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hero not found"})
		return
	}

	c.JSON(http.StatusOK, hero)
}

func (h *HeroHandler) GetHeroStats(c *gin.Context) {
	id := c.Param("id")

	var hero models.Hero
	if err := database.DB.First(&hero, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hero not found"})
		return
	}

	stats := models.HeroStats{
		HeroID:   hero.ID,
		PickRate: hero.PickRate,
		WinRate:  hero.WinRate,
	}

	c.JSON(http.StatusOK, stats)
}

func (h *HeroHandler) GetTopHeroes(c *gin.Context) {
	var heroes []models.Hero

	metric := c.DefaultQuery("metric", "pick_rate")
	limitStr := c.DefaultQuery("limit", "10")

	limit := 10
	if l, err := strconv.Atoi(limitStr); err == nil {
		limit = l
	}

	query := database.DB.Order(metric + " DESC").Limit(limit)

	if err := query.Find(&heroes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top heroes"})
		return
	}

	c.JSON(http.StatusOK, heroes)
}
