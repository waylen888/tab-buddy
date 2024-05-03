package server

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/waylen888/tab-buddy/db"
	"github.com/waylen888/tab-buddy/db/entity"
	"github.com/waylen888/tab-buddy/server/model"
)

type APIHandler struct {
	db db.Database
}

func NewAPIHandler(db db.Database) *APIHandler {
	return &APIHandler{db: db}
}

func (h *APIHandler) getGroups(ctx *gin.Context) {
	groups, err := h.db.GetGroups()
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(groups, func(group entity.Group, _ int) model.Group {
		return model.Group{
			ID:       group.ID,
			Name:     group.Name,
			CreateAt: group.CreateAt,
			UpdateAt: group.UpdateAt,
		}
	}))
}

func (h *APIHandler) getGroup(ctx *gin.Context) {
	id := ctx.Param("id")
	group, err := h.db.GetGroup(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.AbortWithStatus(http.StatusNotFound)
			return
		}
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Group{
		ID:       group.ID,
		Name:     group.Name,
		CreateAt: group.CreateAt,
		UpdateAt: group.UpdateAt,
	})
}

func (h *APIHandler) createGroup(ctx *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	group, err := h.db.CreateGroup(req.Name)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Group{
		ID:       group.ID,
		Name:     group.Name,
		CreateAt: group.CreateAt,
		UpdateAt: group.UpdateAt,
	})
}

func (h *APIHandler) updateGroup(ctx *gin.Context) {
	id := ctx.Param("id")
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	group, err := h.db.UpdateGroup(id, req.Name)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Group{
		ID:       group.ID,
		Name:     group.Name,
		CreateAt: group.CreateAt,
		UpdateAt: group.UpdateAt,
	})
}

func (h *APIHandler) deleteGroup(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := h.db.DeleteGroup(id); err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.Status(http.StatusOK)
}

func (h *APIHandler) getExpenses(ctx *gin.Context) {
	expenses, err := h.db.GetExpenses(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(expenses, func(expense entity.Expense, _ int) model.Expense {
		return model.Expense{
			ID:          expense.ID,
			Amount:      expense.Amount,
			Description: expense.Description,
			CreateAt:    expense.CreateAt,
			UpdateAt:    expense.UpdateAt,
		}
	}))

}

func (h *APIHandler) createExpense(ctx *gin.Context) {
	var req struct {
		Amount      string `json:"amount" binding:"required"`
		Description string `json:"description"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	expense, err := h.db.CreateExpense(ctx.Param("id"), req.Amount, req.Description)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Expense{
		ID:          expense.ID,
		Amount:      expense.Amount,
		Description: expense.Description,
		CreateAt:    expense.CreateAt,
		UpdateAt:    expense.UpdateAt,
	})
}
