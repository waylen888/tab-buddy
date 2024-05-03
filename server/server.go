package server

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/waylen888/tab-buddy/db"
)

type Server struct {
	handler *APIHandler
}

func New(db db.Database) *Server {
	return &Server{
		handler: NewAPIHandler(db),
	}
}

func (s *Server) Run(ctx context.Context, port string) error {
	engine := gin.New()
	engine.Use(gin.Recovery())

	engine.GET("/api/groups", s.handler.getGroups)
	engine.GET("/api/group/:id", s.handler.getGroup)
	engine.POST("/api/group", s.handler.createGroup)
	engine.PUT("/api/group/:id", s.handler.updateGroup)
	engine.DELETE("/api/group/:id", s.handler.deleteGroup)
	engine.GET("/api/group/:id/expenses", s.handler.getExpenses)
	engine.POST("/api/group/:id/expense", s.handler.createExpense)

	return engine.Run(port)
}
