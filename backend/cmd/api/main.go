package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Dimanchick22/ProxyLeague/internal/database"
	"github.com/Dimanchick22/ProxyLeague/internal/handlers"
	"github.com/Dimanchick22/ProxyLeague/internal/middleware"
	"github.com/Dimanchick22/ProxyLeague/internal/websocket"
	"github.com/Dimanchick22/ProxyLeague/pkg/config"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	if err := database.Connect(cfg); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	if err := database.SeedHeroes(); err != nil {
		log.Fatal("Failed to seed heroes:", err)
	}

	hub := websocket.NewHub()
	go hub.Run()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	authHandler := handlers.NewAuthHandler(cfg)
	tournamentHandler := handlers.NewTournamentHandler()
	roomHandler := handlers.NewRoomHandler()
	heroHandler := handlers.NewHeroHandler()
	userHeroHandler := handlers.NewUserHeroHandler(cfg)
	wsHandler := handlers.NewWebSocketHandler(hub)

	api := router.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/profile", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)
			protected.PUT("/avatar", authHandler.UpdateAvatar)
			protected.DELETE("/avatar", authHandler.DeleteAvatar)
			protected.GET("/users", authHandler.GetUsers)

			tournaments := protected.Group("/tournaments")
			{
				tournaments.GET("", tournamentHandler.GetTournaments)
				tournaments.POST("", tournamentHandler.CreateTournament)
				tournaments.GET("/:id", tournamentHandler.GetTournament)
				tournaments.POST("/:id/join", tournamentHandler.JoinTournament)
				tournaments.POST("/:id/start", tournamentHandler.StartTournament)
				tournaments.PUT("/:id/matches/:matchId", tournamentHandler.UpdateMatchResult)
			}

			rooms := protected.Group("/rooms")
			{
				rooms.GET("", roomHandler.GetRooms)
				rooms.POST("", roomHandler.CreateRoom)
				rooms.GET("/:id", roomHandler.GetRoom)
				rooms.POST("/join", roomHandler.JoinRoom)
				rooms.POST("/:id/leave", roomHandler.LeaveRoom)
				rooms.DELETE("/:id", roomHandler.DeleteRoom)
			}

			heroes := protected.Group("/heroes")
			{
				heroes.GET("", heroHandler.GetHeroes)
				heroes.GET("/:id", heroHandler.GetHero)
				heroes.GET("/:id/stats", heroHandler.GetHeroStats)
				heroes.GET("/top", heroHandler.GetTopHeroes)
			}

			userHeroes := protected.Group("/user-heroes")
			{
				userHeroes.POST("/fetch", userHeroHandler.FetchUserHeroes)
				userHeroes.GET("", userHeroHandler.GetUserHeroes)
				userHeroes.GET("/:id", userHeroHandler.GetUserHero)
				userHeroes.DELETE("", userHeroHandler.DeleteUserHeroes)
			}

			protected.GET("/game-profile", userHeroHandler.GetGameProfile)
			protected.PUT("/game-profile", userHeroHandler.UpdateGameProfile)

			protected.GET("/ws", wsHandler.HandleWebSocket)
			protected.GET("/online", wsHandler.GetOnlineUsers)
		}
	}

	serverAddr := ":" + cfg.ServerPort
	log.Printf("Server starting on %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
