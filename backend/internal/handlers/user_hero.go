package handlers

import (
	"net/http"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/models"
	"github.com/Dimanchick22/ProxyLeague/internal/services"
	"github.com/Dimanchick22/ProxyLeague/pkg/config"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHeroHandler struct {
	config *config.Config
}

func NewUserHeroHandler(cfg *config.Config) *UserHeroHandler {
	return &UserHeroHandler{
		config: cfg,
	}
}

func (h *UserHeroHandler) FetchUserHeroes(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req models.FetchUserHeroesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	gameProfile := models.UserGameProfile{
		UserID: userID,
		RoleID: req.RoleID,
		Server: req.Server,
	}

	if err := database.DB.Where("user_id = ?", userID).Assign(gameProfile).FirstOrCreate(&gameProfile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save game profile"})
		return
	}

	hoyolabService := services.NewHoYoLabService(h.config.HoYoLabLTokenV2, h.config.HoYoLabLTuidV2)

	avatarIDs := services.GetDefaultAvatarIDs()

	heroes, err := hoyolabService.FetchAllHeroes(req.Server, req.RoleID, avatarIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch heroes from HoYoLAB"})
		return
	}

	if err := database.DB.Where("user_id = ?", userID).Delete(&models.UserHero{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old heroes"})
		return
	}

	var savedHeroes []models.UserHero
	for _, hero := range heroes {
		userHero := models.UserHero{
			UserID:            userID,
			AvatarID:          hero.ID,
			Level:             hero.Level,
			Name:              hero.Name,
			FullName:          hero.FullName,
			ElementType:       hero.ElementType,
			CampName:          hero.CampName,
			AvatarProfession:  hero.AvatarProfession,
			Rarity:            hero.Rarity,
			GroupIconPath:     hero.GroupIconPath,
			HollowIconPath:    hero.HollowIconPath,
			RoleVerticalURL:   hero.RoleVerticalURL,
			RoleSquareURL:     hero.RoleSquareURL,
			VerticalColor:     hero.VerticalColor,
			Rank:              hero.Rank,
			SubElementType:    hero.SubElementType,
		}

		if err := database.DB.Create(&userHero).Error; err != nil {
			continue
		}

		for _, equip := range hero.Equip {
			equipment := models.UserEquipment{
				UserHeroID:           userHero.ID,
				EquipID:              equip.ID,
				Level:                equip.Level,
				Name:                 equip.Name,
				Icon:                 equip.Icon,
				Rarity:               equip.Rarity,
				EquipmentType:        equip.EquipmentType,
				InvalidPropertyCount: equip.InvalidPropertyCount,
				AllHit:               equip.AllHit,
				SuitID:               equip.EquipSuit.SuitID,
				SuitName:             equip.EquipSuit.Name,
				SuitOwn:              equip.EquipSuit.Own,
				SuitDesc1:            equip.EquipSuit.Desc1,
				SuitDesc2:            equip.EquipSuit.Desc2,
			}
			database.DB.Create(&equipment)
		}

		weapon := models.UserWeapon{
			UserHeroID:    userHero.ID,
			WeaponID:      hero.Weapon.ID,
			Level:         hero.Weapon.Level,
			Name:          hero.Weapon.Name,
			Star:          hero.Weapon.Star,
			Icon:          hero.Weapon.Icon,
			Rarity:        hero.Weapon.Rarity,
			TalentTitle:   hero.Weapon.TalentTitle,
			TalentContent: hero.Weapon.TalentContent,
			Profession:    hero.Weapon.Profession,
		}
		database.DB.Create(&weapon)

		for _, skill := range hero.Skills {
			userSkill := models.UserSkill{
				UserHeroID:  userHero.ID,
				Level:       skill.Level,
				SkillType:   skill.SkillType,
				AwakenState: skill.AwakenState,
			}
			database.DB.Create(&userSkill)
		}

		for _, rank := range hero.Ranks {
			userRank := models.UserRank{
				UserHeroID: userHero.ID,
				RankID:     rank.ID,
				Name:       rank.Name,
				Desc:       rank.Desc,
				Pos:        rank.Pos,
				IsUnlocked: rank.IsUnlocked,
			}
			database.DB.Create(&userRank)
		}

		savedHeroes = append(savedHeroes, userHero)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Heroes fetched successfully",
		"count":   len(savedHeroes),
	})
}

func (h *UserHeroHandler) GetUserHeroes(c *gin.Context) {
	userID := c.GetUint("user_id")

	var heroes []models.UserHero
	if err := database.DB.
		Where("user_id = ?", userID).
		Preload("Equipment").
		Preload("Weapon").
		Preload("Skills").
		Preload("Ranks").
		Order("level DESC, rarity DESC").
		Find(&heroes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch heroes"})
		return
	}

	c.JSON(http.StatusOK, heroes)
}

func (h *UserHeroHandler) GetUserHero(c *gin.Context) {
	userID := c.GetUint("user_id")
	heroID := c.Param("id")

	var hero models.UserHero
	if err := database.DB.
		Where("id = ? AND user_id = ?", heroID, userID).
		Preload("Equipment").
		Preload("Weapon").
		Preload("Skills").
		Preload("Ranks").
		First(&hero).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Hero not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hero"})
		}
		return
	}

	c.JSON(http.StatusOK, hero)
}

func (h *UserHeroHandler) GetGameProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var profile models.UserGameProfile
	if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Game profile not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch game profile"})
		}
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *UserHeroHandler) UpdateGameProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req models.FetchUserHeroesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	gameProfile := models.UserGameProfile{
		UserID: userID,
		RoleID: req.RoleID,
		Server: req.Server,
	}

	if err := database.DB.Where("user_id = ?", userID).Assign(gameProfile).FirstOrCreate(&gameProfile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update game profile"})
		return
	}

	c.JSON(http.StatusOK, gameProfile)
}

func (h *UserHeroHandler) DeleteUserHeroes(c *gin.Context) {
	userID := c.GetUint("user_id")

	if err := database.DB.Where("user_id = ?", userID).Delete(&models.UserHero{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete heroes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Heroes deleted successfully"})
}
