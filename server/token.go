package server

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/waylen888/tab-buddy/db"
)

func extractBearerToken(header string) (string, error) {
	if header == "" {
		return "", errors.New("bad header value given")
	}

	jwtToken := strings.Split(header, " ")
	if len(jwtToken) != 2 {
		return "", errors.New("incorrectly formatted authorization header")
	}

	return jwtToken[1], nil
}

func parseToken(jwtToken string) (*jwt.Token, error) {
	return jwt.Parse(jwtToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("bad signed method received")
		}
		return []byte(TOKEN_SECRET), nil
	})
}

func jwtTokenCheck(db db.Database) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		jwtToken, err := extractBearerToken(ctx.GetHeader("Authorization"))
		if err != nil {
			ctx.AbortWithError(http.StatusUnauthorized, err)
			return
		}

		token, err := parseToken(jwtToken)
		if err != nil {
			ctx.AbortWithError(http.StatusUnauthorized, err)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ctx.AbortWithError(http.StatusUnauthorized, err)
			return
		}
		username, ok := claims["username"].(string)
		if !ok {
			ctx.AbortWithError(http.StatusUnauthorized, err)
			return
		}
		user, err := db.GetUserByUsername(username)
		if err != nil {
			ctx.AbortWithError(http.StatusForbidden, err)
			return
		}
		ctx.Set("user", user)
		ctx.Next()
	}
}
