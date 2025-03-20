package server

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/h2non/filetype"
	"github.com/rs/xid"
	"github.com/samber/lo"
	"github.com/shopspring/decimal"
	"github.com/waylen888/tab-buddy/app"
	"github.com/waylen888/tab-buddy/calc"
	"github.com/waylen888/tab-buddy/db"
	"github.com/waylen888/tab-buddy/db/entity"
	"github.com/waylen888/tab-buddy/finmind"
	"github.com/waylen888/tab-buddy/mail"
	"github.com/waylen888/tab-buddy/server/model"
)

type APIHandler struct {
	db         db.Database
	rateGetter finmind.TaiwanExchangeRateGetter
	dataDir    string
	mailSender *mail.Sender
}

func NewAPIHandler(
	db db.Database,
	rateGetter finmind.TaiwanExchangeRateGetter,
	dataDir string,
	mailSender *mail.Sender,
) (*APIHandler, error) {
	return &APIHandler{
		db:         db,
		rateGetter: rateGetter,
		dataDir:    dataDir,
		mailSender: mailSender,
	}, nil
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

	go func() {
		err := h.mailSender.SendMail(
			[]string{user.Email},
			"用戶登入通知",
			fmt.Sprintf("您的帳號%s被登入，IP: %s", user.Username, ctx.ClientIP()),
		)
		if err != nil {
			slog.Error("send login notify", "error", err)
		}
	}()

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

func getGooglePeople(ctx context.Context, accessToken string) (PeopleResponse, error) {
	req, err := http.NewRequestWithContext(ctx,
		"GET",
		"https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,metadata",
		nil,
	)
	if err != nil {
		return PeopleResponse{}, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return PeopleResponse{}, fmt.Errorf("do request: %w", err)
	}
	defer res.Body.Close()

	var resp PeopleResponse
	if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
		return PeopleResponse{}, fmt.Errorf("decode response: %w", err)
	}
	return resp, nil
}

func (h *APIHandler) loginByGoogleToken(ctx *gin.Context) {
	// returning token and refresh_token
	var req struct {
		AccessToken string `json:"accessToken" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}

	people, err := getGooglePeople(ctx.Request.Context(), req.AccessToken)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// try login
	user, err := h.db.GetUserByUsername(people.GetID())
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		// create user
		user, err = h.db.CreateUser(people.GetID(), people.GetDisplayName(), people.GetEmail(), "", entity.UserCreateTypeGoogle)
		if err != nil {
			ctx.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	} else if err != nil {
		ctx.AbortWithError(http.StatusForbidden, err)
		return
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 30).Unix(),
	})
	tokenStr, err := jwtToken.SignedString([]byte(TOKEN_SECRET))
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
	user, err := h.db.CreateUser(req.Username, req.DisplayName, req.Email, req.Password, entity.UserCreateTypeDefault)
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
			ID:           group.ID,
			Name:         group.Name,
			ConvertToTwd: group.ConvertToTwd.Bool(),
			CreateAt:     group.CreateAt,
			UpdateAt:     group.UpdateAt,
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
		ID:           group.ID,
		Name:         group.Name,
		ConvertToTwd: group.ConvertToTwd.Bool(),
		CreateAt:     group.CreateAt,
		UpdateAt:     group.UpdateAt,
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
		ID:           group.ID,
		Name:         group.Name,
		ConvertToTwd: group.ConvertToTwd.Bool(),
		CreateAt:     group.CreateAt,
		UpdateAt:     group.UpdateAt,
	})
}

func (h *APIHandler) updateGroup(ctx *gin.Context) {
	id := ctx.Param("id")
	var req struct {
		Name         string `json:"name" binding:"required"`
		ConvertToTwd bool   `json:"convertToTwd"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	group, err := h.db.UpdateGroup(id, req.Name, req.ConvertToTwd)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Group{
		ID:           group.ID,
		Name:         group.Name,
		ConvertToTwd: group.ConvertToTwd.Bool(),
		CreateAt:     group.CreateAt,
		UpdateAt:     group.UpdateAt,
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
	var toTWD calc.TWDBool
	if ctx.Query("to_twd") != "" {
		toTWD = calc.TWDBool(true)
	} else {
		group, err := h.db.GetGroup(ctx.Param("id"), GetUser(ctx).ID)
		if err != nil {
			ctx.AbortWithError(http.StatusInternalServerError, err)
			return
		}
		toTWD = group.ConvertToTwd
	}

	expenses, err := h.db.GetGroupExpenses(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, lo.Map(expenses, func(expense entity.ExpenseWithSplitUser, _ int) model.GroupExpense {
		var currency entity.Currency
		if toTWD {
			currency, _ = h.db.GetCurrency("TWD")
		} else {
			currency, _ = h.db.GetCurrency(expense.CurrencyCode)
		}
		return model.GroupExpense{
			Expense: model.Expense{
				ID:          expense.ID,
				Amount:      toTWD.ToTWD(expense.Amount, expense.TWDRate, currency.DecimalDigits),
				Description: expense.Description,
				Date:        expense.Date,
				Category:    expense.Category,
				TWDRate:     expense.TWDRate,
				CreateAt:    expense.CreateAt,
				UpdateAt:    expense.UpdateAt,
			},
			Currency: model.Currency(currency),
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
					Paid:   user.Paid,
					Owed:   user.Owed,
					Amount: toTWD.ToTWD(user.Amount, expense.TWDRate, currency.DecimalDigits),
				}
			}),
		}
	}))

}

func (h *APIHandler) createExpense(ctx *gin.Context) {
	type SplitUser struct {
		ID   string `json:"id"`
		Paid bool   `json:"paid"`
		Owed bool   `json:"owed"`
	}
	var req struct {
		Amount       string      `json:"amount" binding:"required"`
		Description  string      `json:"description" binding:"required"`
		Date         time.Time   `json:"date" binding:"required"`
		CurrencyCode string      `json:"currencyCode" binding:"required"`
		Category     string      `json:"category"`
		Note         string      `json:"note"`
		SplitUsers   []SplitUser `json:"splitUsers" binding:"required,gt=0"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}

	if paidCount := lo.CountBy(req.SplitUsers, func(user SplitUser) bool {
		return user.Paid
	}); paidCount == 0 {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("no one paid"))
		return
	} else if paidCount > 1 {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("more than one paid"))
		return
	}

	if owedCount := lo.CountBy(req.SplitUsers, func(user SplitUser) bool {
		return user.Owed
	}); owedCount == 0 {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("no one owed"))
		return
	}

	rate, err := h.rateGetter.GetExchangeRate(req.CurrencyCode)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	expense, err := h.db.CreateExpense(entity.CreateExpenseArguments{
		GroupID:      ctx.Param("id"),
		Amount:       req.Amount,
		TWDRate:      rate.String(),
		Description:  req.Description,
		Date:         req.Date,
		CurrencyCode: req.CurrencyCode,
		Note:         req.Note,
		Category:     req.Category,
		SplitUsers: lo.Map(req.SplitUsers, func(user SplitUser, _ int) entity.SplitUser {
			return entity.SplitUser{
				User: entity.User{ID: user.ID},
				Paid: user.Paid,
				Owed: user.Owed,
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
		Category:    expense.Category,
		TWDRate:     expense.TWDRate,
		CreateAt:    expense.CreateAt,
		UpdateAt:    expense.UpdateAt,
	})
}

func (h *APIHandler) updateExpense(ctx *gin.Context) {
	type SplitUser struct {
		ID   string `json:"id"`
		Paid bool   `json:"paid"`
		Owed bool   `json:"owed"`
	}
	var req struct {
		Amount       string      `json:"amount" binding:"required"`
		Description  string      `json:"description" binding:"required"`
		Date         time.Time   `json:"date" binding:"required"`
		CurrencyCode string      `json:"currencyCode" binding:"required"`
		Category     string      `json:"category"`
		Note         string      `json:"note"`
		SplitUsers   []SplitUser `json:"splitUsers" binding:"required,gt=0"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}

	if paidCount := lo.CountBy(req.SplitUsers, func(user SplitUser) bool {
		return user.Paid
	}); paidCount == 0 {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("no one paid"))
		return
	} else if paidCount > 1 {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("more than one paid"))
		return
	}

	if owedCount := lo.CountBy(req.SplitUsers, func(user SplitUser) bool {
		return user.Owed
	}); owedCount == 0 {
		ctx.AbortWithError(http.StatusBadRequest, fmt.Errorf("no one owed"))
		return
	}

	rate, err := h.rateGetter.GetExchangeRate(req.CurrencyCode)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	expense, err := h.db.UpdateExpense(entity.UpdateExpenseArguments{
		GroupID:      ctx.Param("id"),
		ExpenseID:    ctx.Param("expense_id"),
		Amount:       req.Amount,
		TWDRate:      rate.String(),
		Description:  req.Description,
		Date:         req.Date,
		CurrencyCode: req.CurrencyCode,
		Note:         req.Note,
		Category:     req.Category,
		SplitUsers: lo.Map(req.SplitUsers, func(user SplitUser, _ int) entity.SplitUser {
			return entity.SplitUser{
				User: entity.User{ID: user.ID},
				Paid: user.Paid,
				Owed: user.Owed,
			}
		}),
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
		Category:    expense.Category,
		TWDRate:     expense.TWDRate,
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
			sum = calc.SplitValue(expense.Amount, lo.Map(expense.SplitUsers, func(su entity.SplitUser, _ int) calc.SplitUser {
				return calc.SplitUser{
					ID:   su.ID,
					Paid: su.Paid,
					Owed: su.Owed,
				}
			}), user.ID)
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

func (h *APIHandler) removeGroupMember(ctx *gin.Context) {
	err := h.db.RemoveMemeberFromGroup(ctx.Param("id"), ctx.Param("member_id"))
	if err != nil {
		if errors.Is(err, db.ErrUserStillHasExpense) {
			ctx.AbortWithError(http.StatusBadRequest, err)
		} else {
			ctx.AbortWithError(http.StatusInternalServerError, err)
		}
		return
	}

	ctx.Status(http.StatusOK)
}

func (h *APIHandler) inviteUserToGroup(ctx *gin.Context) {
	var req struct {
		Username *string `json:"username"`
		Email    *string `json:"email"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}
	if err := h.db.AddUserToGroupByUsername(ctx.Param("id"), req.Username, req.Email); err != nil {
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

	currency, err := h.db.GetCurrency(expense.CurrencyCode)
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
			Category:    expense.Category,
			TWDRate:     expense.TWDRate,
			Currency:    model.Currency(currency),
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
				Paid:   splitUser.Paid,
				Owed:   splitUser.Owed,
				Amount: splitUser.Amount,
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

func (h *APIHandler) noRoute(ctx *gin.Context) {

	dir, file := path.Split(ctx.Request.RequestURI)
	if strings.HasPrefix(dir, "/api") || strings.HasPrefix(dir, "/google") {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}

	file = strings.Split(file, "?")[0]
	ext := path.Ext(file)
	ctx.Header("Cache-Control", "no-cache")

	var uri string
	if file == "" || ext == "" {
		uri = path.Join("dist", "index.html")
	} else {
		uri = path.Join("dist", dir, file)
	}

	data, err := app.FS.ReadFile(uri)
	if err != nil {
		ctx.AbortWithError(http.StatusNotFound, err)
		return
	}

	etag := fmt.Sprintf("%x", md5.Sum(data))
	ctx.Header("ETag", etag)
	if match := ctx.GetHeader("If-None-Match"); match != "" {
		if strings.Contains(match, etag) {
			ctx.Status(http.StatusNotModified)
			return
		}
	}

	ctype := mime.TypeByExtension(path.Ext(uri))
	if ctype == "" {
		ctype = http.DetectContentType(data)
	}
	ctx.Data(http.StatusOK, ctype, data)
}

func (h *APIHandler) getExpenseComments(ctx *gin.Context) {
	cs, err := h.db.GetExpenseComments(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(cs, func(c entity.Comment, _ int) model.Comment {
		return model.Comment{
			ID:          c.ID,
			Content:     c.Content,
			CreateBy:    c.CreateBy,
			DisplayName: c.DisplayName,
			CreateAt:    c.CreateAt,
			UpdateAt:    c.UpdateAt,
		}
	}))
}

func (h *APIHandler) createExpenseComment(ctx *gin.Context) {
	var req struct {
		ExpenseID string `json:"expenseId" binding:"required"`
		Content   string `json:"content" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}

	comment, err := h.db.CreateComment(entity.CreateCommentArguments{
		ExpenseID: req.ExpenseID,
		Content:   req.Content,
		CreateBy:  GetUser(ctx).ID,
	})
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.Comment{
		ID:          comment.ID,
		Content:     comment.Content,
		CreateBy:    comment.CreateBy,
		DisplayName: comment.DisplayName,
		CreateAt:    comment.CreateAt,
		UpdateAt:    comment.UpdateAt,
	})
}

func (h *APIHandler) deleteExpenseComment(ctx *gin.Context) {
	err := h.db.DeleteComment(entity.DeleteCommentArguments{
		ID:     ctx.Param("comment_id"),
		UserID: GetUser(ctx).ID,
	})
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.Status(http.StatusOK)
}

func (h *APIHandler) uploadExpenseAttachment(ctx *gin.Context) {

	form, err := ctx.MultipartForm()
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	for key, formValue := range form.File {
		switch key {
		case "image":
			if err := h.handleImageForm(ctx, formValue); err != nil {
				ctx.AbortWithError(http.StatusInternalServerError, err)
				return
			}
		case "file":
			if err := h.handleImageForm(ctx, formValue); err != nil {
				ctx.AbortWithError(http.StatusInternalServerError, err)
				return
			}
		default:
			ctx.AbortWithError(http.StatusBadRequest, errors.New("invalid form"))
			return
		}
	}
	ctx.Status(http.StatusOK)
}

func (h *APIHandler) deleteExpenseAttachment(ctx *gin.Context) {
	attachmentID := ctx.Param("attachment_id")
	if err := h.db.DeleteExpenseAttachment(attachmentID); err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	if err := os.Remove(filepath.Join(h.dataDir, attachmentID)); err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.Status(http.StatusOK)
}

func (h *APIHandler) handleImageForm(ctx *gin.Context, formValue []*multipart.FileHeader) error {
	var eps []entity.ExpenseAttachment
	for _, fileHeader := range formValue {
		ep, err := func() (entity.ExpenseAttachment, error) {
			now := time.Now()
			ID := xid.NewWithTime(now).String()
			storePath := filepath.Join(h.dataDir, ID)
			if err := ctx.SaveUploadedFile(fileHeader, storePath); err != nil {
				return entity.ExpenseAttachment{}, err
			}

			ftype, err := filetype.MatchFile(storePath)
			if err != nil {
				return entity.ExpenseAttachment{}, err
			}

			if ftype == filetype.Unknown {
				ftype = filetype.NewType(filepath.Ext(fileHeader.Filename), fileHeader.Header.Get("Content-Type"))
			}

			return entity.ExpenseAttachment{
				ID:       ID,
				Filename: fileHeader.Filename,
				Size:     fileHeader.Size,
				MIME:     ftype.MIME.Value,
				CreateAt: now,
			}, nil
		}()
		if err != nil {
			// upload failed, cleanup file
			lo.ForEach(eps, func(ep entity.ExpenseAttachment, _ int) {
				os.Remove(filepath.Join(h.dataDir, ep.ID))
			})
			return err
		}
		eps = append(eps, ep)
	}

	err := h.db.CreateExpenseAttachments(entity.CreateExpenseAttachmentsArgument{
		ExpenseID:   ctx.Param("id"),
		Attachments: eps,
	})
	if err != nil {
		// write database failed, cleanup file
		lo.ForEach(eps, func(ep entity.ExpenseAttachment, _ int) {
			os.Remove(filepath.Join(h.dataDir, ep.ID))
		})
		return err
	}
	return nil
}

func (h *APIHandler) getExpenseAttachments(ctx *gin.Context) {

	attachments, err := h.db.GetExpenseAttachments(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, lo.Map(attachments, func(attachment entity.ExpenseAttachment, _ int) model.ExpenseAttachment {
		return model.ExpenseAttachment{
			ID:       attachment.ID,
			Filename: attachment.Filename,
			Size:     attachment.Size,
			MIME:     attachment.MIME,
			CreateAt: attachment.CreateAt,
			UpdateAt: attachment.UpdateAt,
		}
	}))
}

func (h *APIHandler) staticPhoto(ctx *gin.Context) {
	attachment, err := h.db.GetExpenseAttachment(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	filepath := filepath.Join(h.dataDir, attachment.ID)
	if ctx.Query("thumbnail") != "" {
		filepath = filepath + "-thumbnail"
	}

	file, err := os.Open(filepath)
	if err != nil {
		ctx.AbortWithError(http.StatusNotFound, err)
		return
	}
	defer file.Close()

	ctx.Header("Cache-Control", "max-age=31536000")
	ctx.DataFromReader(http.StatusOK, attachment.Size, attachment.MIME, file, nil)
}

func (h *APIHandler) getMeSetting(ctx *gin.Context) {
	setting, err := h.db.GetUserSetting(GetUser(ctx).ID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.UserSetting{
		ThemeMode:        setting.ThemeMode,
		PushNotification: setting.PushNotification,
	})
}

func (h *APIHandler) patchMeSetting(ctx *gin.Context) {
	var req struct {
		ThemeMode        *string `json:"themeMode"`
		PushNotification *bool   `json:"pushNotification"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.AbortWithError(http.StatusBadRequest, err)
		return
	}

	setting, err := h.db.UpdateUserSetting(GetUser(ctx).ID, req.ThemeMode, req.PushNotification)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.JSON(http.StatusOK, model.UserSetting{
		ThemeMode:        setting.ThemeMode,
		PushNotification: setting.PushNotification,
	})
}
