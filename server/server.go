package server

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/waylen888/tab-buddy/config"
	"github.com/waylen888/tab-buddy/db"
	"github.com/waylen888/tab-buddy/finmind"
)

type Server struct {
	handler       *APIHandler
	googleHandler *GoogleHandler
}

func New(db db.Database, oauthCfg config.GoogleOAuth) *Server {
	return &Server{
		handler:       NewAPIHandler(db, finmind.NewClient()),
		googleHandler: NewGoogleHandler(db, oauthCfg),
	}
}

func (s *Server) Run(ctx context.Context, port string) error {
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(gin.Logger())

	engine.GET("/google/oauth/callback", s.googleHandler.Callback)
	engine.GET("/google/oauth/login", s.googleHandler.Login)
	engine.GET("/api/google/oauth/login", s.googleHandler.Login)

	engine.NoRoute(s.handler.noRoute)

	engine.POST("/api/auth/login", s.handler.login)
	engine.GET("/api/auth/refresh_token", jwtTokenCheck(s.handler.db), s.handler.refreshToken)

	engine.POST("/api/user", s.handler.createUser)

	authRoute := engine.Group("", jwtTokenCheck(s.handler.db))
	authRoute.GET("/api/groups", s.handler.getGroups)
	authRoute.GET("/api/group/:id", s.handler.getGroup)
	authRoute.POST("/api/group", s.handler.createGroup)
	authRoute.PUT("/api/group/:id", s.handler.updateGroup)
	authRoute.DELETE("/api/group/:id", s.handler.deleteGroup)
	authRoute.GET("/api/group/:id/expenses", s.handler.getGroupExpenses)
	authRoute.POST("/api/group/:id/expense", s.handler.createExpense)
	authRoute.GET("/api/group/:id/members", s.handler.getGroupMembers)
	authRoute.POST("/api/group/:id/invite", s.handler.inviteUserToGroup)
	authRoute.GET("/api/expense/:id", s.handler.getExpense)
	authRoute.GET("/api/currencies", s.handler.getCurrencies)

	return engine.Run(port)
}
