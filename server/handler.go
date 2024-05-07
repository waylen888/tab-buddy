package server

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/samber/lo"
	"github.com/shopspring/decimal"
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

const TOKEN_SECRET = "Kia9012)f^#$$"

func (h *APIHandler) login(ctx *gin.Context) {
	// returning token and refresh_token
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	user, err := h.db.GetUserByUsername(req.Username)
	if err != nil {
		ctx.AbortWithError(http.StatusForbidden, err)
		return
	}
	if err := user.CheckPassword(req.Password); err != nil {
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 30).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(TOKEN_SECRET))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"token": tokenStr,
		"user": model.User{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			CreateAt:    user.CreateAt,
			UpdateAt:    user.UpdateAt,
		},
	})
}

func (h *APIHandler) refreshToken(ctx *gin.Context) {
	anyObj, ok := ctx.Get("user")
	if !ok {
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	user, ok := anyObj.(entity.User)
	if !ok {
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 30).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(TOKEN_SECRET))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"token": tokenStr,
		"user": model.User{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			CreateAt:    user.CreateAt,
			UpdateAt:    user.UpdateAt,
		},
	})
}

func (h *APIHandler) createUser(ctx *gin.Context) {
	var req struct {
		Username    string `json:"username" binding:"required"`
		Password    string `json:"password" binding:"required"`
		DisplayName string `json:"displayName" binding:"required"`
		Email       string `json:"email"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	user, err := h.db.CreateUser(req.Username, req.DisplayName, req.Email, req.Password)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.User{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		CreateAt:    user.CreateAt,
		UpdateAt:    user.UpdateAt,
	})
}

func (h *APIHandler) getGroups(ctx *gin.Context) {
	groups, err := h.db.GetGroups(GetUser(ctx).ID)
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
	group, err := h.db.GetGroup(id, GetUser(ctx).ID)
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

	group, err := h.db.CreateGroup(req.Name, GetUser(ctx).ID)
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

func (h *APIHandler) getGroupExpenses(ctx *gin.Context) {
	expenses, err := h.db.GetGroupExpenses(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(expenses, func(expense entity.ExpenseWithSplitUser, _ int) model.ExpenseWithSplitUsers {
		return model.ExpenseWithSplitUsers{
			Expense: model.Expense{
				ID:          expense.ID,
				Amount:      expense.Amount,
				Description: expense.Description,
				Date:        expense.Date,
				CreateAt:    expense.CreateAt,
				UpdateAt:    expense.UpdateAt,
			},
			SplitUsers: lo.Map(expense.SplitUsers, func(user entity.SplitUser, _ int) model.SplitUser {
				return model.SplitUser{
					User: model.User{
						ID:          user.ID,
						Username:    user.Username,
						DisplayName: user.DisplayName,
						Email:       user.Email,
						CreateAt:    user.CreateAt,
						UpdateAt:    user.UpdateAt,
					},
					Paid: user.Paid,
				}
			}),
		}
	}))

}

func (h *APIHandler) createExpense(ctx *gin.Context) {
	type SplitUser struct {
		ID   string `json:"id"`
		Paid bool   `json:"paid"`
	}
	var req struct {
		Amount      string      `json:"amount" binding:"required"`
		Description string      `json:"description" binding:"required"`
		Date        time.Time   `json:"date" binding:"required"`
		Currency    string      `json:"currency" binding:"required"`
		SplitUsers  []SplitUser `json:"splitUsers" binding:"required,gt=0"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}

	if !lo.SomeBy(req.SplitUsers, func(user SplitUser) bool {
		return user.Paid
	}) {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("no one paid"))
		return
	}

	expense, err := h.db.CreateExpense(entity.CreateExpenseArguments{
		GroupID:     ctx.Param("id"),
		Amount:      req.Amount,
		Description: req.Description,
		Date:        req.Date,
		Currency:    req.Currency,
		SplitUsers: lo.Map(req.SplitUsers, func(user SplitUser, _ int) entity.SplitUser {
			return entity.SplitUser{
				User: entity.User{ID: user.ID},
				Paid: user.Paid,
			}
		}),
		CreateByUserID: GetUser(ctx).ID,
	})
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Expense{
		ID:          expense.ID,
		Amount:      expense.Amount,
		Description: expense.Description,
		Date:        expense.Date,
		CreateAt:    expense.CreateAt,
		UpdateAt:    expense.UpdateAt,
	})
}

func (h *APIHandler) getGroupMembers(ctx *gin.Context) {
	members, err := h.db.GetGroupMembers(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	expenses, err := h.db.GetGroupExpenses(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(members, func(user entity.User, _ int) model.GroupMember {

		sum := decimal.NewFromFloat(0)
		for _, expense := range expenses {
			amount, _ := decimal.NewFromString(expense.Amount)
			numberOfUsers := decimal.NewFromInt(int64(len(expense.SplitUsers)))

			avg := amount.Div(numberOfUsers)
			for _, splitUser := range expense.SplitUsers {
				if splitUser.ID != user.ID {
					continue
				}
				if splitUser.Paid && user.ID == splitUser.ID {
					sum = sum.Add(avg.Mul(numberOfUsers.Sub(decimal.NewFromInt(1))))
				} else {
					sum = sum.Sub(amount.Div(numberOfUsers))
				}
			}
		}

		return model.GroupMember{
			User: model.User{
				ID:          user.ID,
				Username:    user.Username,
				DisplayName: user.DisplayName,
				Email:       user.Email,
				CreateAt:    user.CreateAt,
				UpdateAt:    user.UpdateAt,
			},
			Amount: sum.StringFixed(2),
		}
	}))
}

func (h *APIHandler) inviteUserToGroup(ctx *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	if err := h.db.AddUserToGroupByUsername(ctx.Param("id"), req.Username); err != nil {
		if errors.Is(err, db.ErrUserAlreadyInGroup) {
			ctx.Status(http.StatusOK)
			return
		}
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.Status(http.StatusOK)
}

func (h *APIHandler) getExpense(ctx *gin.Context) {
	expense, err := h.db.GetExpense(ctx.Param("id"))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.AbortWithStatus(http.StatusNotFound)
			return
		}
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	createdBy, err := h.db.GetUser(expense.CreatedBy)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, model.ExpenseWithSplitUsers{
		Expense: model.Expense{
			ID:          expense.ID,
			Amount:      expense.Amount,
			Description: expense.Description,
			Date:        expense.Date,
			CreateAt:    expense.CreateAt,
			UpdateAt:    expense.UpdateAt,
			CreatedBy: model.User{
				ID:          createdBy.ID,
				Username:    createdBy.Username,
				DisplayName: createdBy.DisplayName,
				Email:       createdBy.Email,
				CreateAt:    createdBy.CreateAt,
				UpdateAt:    createdBy.UpdateAt,
			},
		},
		SplitUsers: lo.Map(expense.SplitUsers, func(splitUser entity.SplitUser, _ int) model.SplitUser {
			return model.SplitUser{
				User: model.User{
					ID:          splitUser.ID,
					Username:    splitUser.Username,
					DisplayName: splitUser.DisplayName,
					Email:       splitUser.Email,
					CreateAt:    splitUser.CreateAt,
					UpdateAt:    splitUser.UpdateAt,
				},
				Paid: splitUser.Paid,
			}
		}),
	})
}

func (h *APIHandler) getCurrencies(ctx *gin.Context) {
	currencies, err := h.db.GetCurrencies()
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(currencies, func(currency entity.Currency, _ int) model.Currency {
		return model.Currency{
			Code:          currency.Code,
			Name:          currency.Name,
			NamePlural:    currency.NamePlural,
			Symbol:        currency.Symbol,
			SymbolNative:  currency.SymbolNative,
			DecimalDigits: currency.DecimalDigits,
			Rounding:      currency.Rounding,
		}
	}))
}
