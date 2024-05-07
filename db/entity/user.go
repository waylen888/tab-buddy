package entity

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID          string
	Username    string
	DisplayName string
	Email       string
	Password    string
	CreateAt    time.Time
	UpdateAt    time.Time
}

func (u User) CheckPassword(plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plainPassword))
}
