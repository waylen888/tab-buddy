package server

import (
	"github.com/gin-gonic/gin"
	"github.com/waylen888/tab-buddy/db/entity"
)

func GetUser(ctx *gin.Context) (user entity.User) {
	anyObj, _ := ctx.Get("user")
	user, _ = anyObj.(entity.User)
	return
}
