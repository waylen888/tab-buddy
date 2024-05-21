package server

import (
	"context"
	"fmt"
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

func New(db db.Database, cfg config.Config) (*Server, error) {
	handler, err := NewAPIHandler(db, finmind.NewClient(), cfg.DataDir, mail.NewSender(cfg.SMTP))
	if err != nil {
		return nil, fmt.Errorf("new handler: %w", err)
	}
	return &Server{
		handler:       handler,
		googleHandler: NewGoogleHandler(db, cfg.GoogleOAuth),
	}, nil
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

	engine.GET("/static/photo/:id", s.handler.staticPhoto)
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
	authRoute.POST("/api/expense/:id/attachment", s.handler.uploadExpenseAttachment)
	authRoute.DELETE("/api/expense/:id/attachment/:attachment_id", s.handler.deleteExpenseAttachment)
	authRoute.GET("/api/expense/:id/attachments", s.handler.getExpenseAttachments)
	authRoute.GET("/api/me/setting", s.handler.getMeSetting)
	authRoute.PATCH("/api/me/setting", s.handler.patchMeSetting)

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
