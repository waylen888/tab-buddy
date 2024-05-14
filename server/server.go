package server

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waylen888/tab-buddy/config"
	"github.com/waylen888/tab-buddy/db"
	"github.com/waylen888/tab-buddy/finmind"
	"github.com/waylen888/tab-buddy/mail"
)

type Server struct {
	handler       *APIHandler
	googleHandler *GoogleHandler
}

func New(db db.Database, cfg config.Config) *Server {
	return &Server{
		handler:       NewAPIHandler(db, finmind.NewClient(), cfg.PhotoStoreDir, mail.NewSender(cfg.SMTP)),
		googleHandler: NewGoogleHandler(db, cfg.GoogleOAuth),
	}
}

func (s *Server) Run(ctx context.Context, httpSetting config.HTTPSetting) error {
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
	authRoute.PUT("/api/group/:id/expense/:expense_id", s.handler.updateExpense)
	authRoute.GET("/api/group/:id/members", s.handler.getGroupMembers)
	authRoute.POST("/api/group/:id/invite", s.handler.inviteUserToGroup)
	authRoute.GET("/api/expense/:id", s.handler.getExpense)
	authRoute.GET("/api/currencies", s.handler.getCurrencies)
	authRoute.GET("/api/expense/:id/comments", s.handler.getExpenseComments)
	authRoute.POST("/api/expense/:id/comment", s.handler.createExpenseComment)
	authRoute.DELETE("/api/expense/:id/comment/:comment_id", s.handler.deleteExpenseComment)
	authRoute.POST("/api/expense/:id/photos", s.handler.uploadExpensePhotos)
	authRoute.GET("/api/expense/:id/photos", s.handler.getExpensePhotos)
	// authRoute.GET("/static/photo/:id", s.handler.staticPhoto)
	engine.GET("/static/photo/:id", s.handler.staticPhoto)

	slog.Info("server start", "listen", httpSetting.Listen)
	server := http.Server{
		Addr:    httpSetting.Listen,
		Handler: engine,
	}
	if httpSetting.CertFilePath != "" && httpSetting.KeyFilePath != "" {
		return server.ListenAndServeTLS(httpSetting.CertFilePath, httpSetting.KeyFilePath)
	}
	return server.ListenAndServe()
}
