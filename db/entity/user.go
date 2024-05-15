package entity

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserCreateType uint8

var (
	UserCreateTypeDefault UserCreateType = 0
	UserCreateTypeGoogle  UserCreateType = 1
)

type User struct {
	ID          string
	Username    string
	DisplayName string
	Email       string
	CreateType  UserCreateType
	Password    string
	CreateAt    time.Time
	UpdateAt    time.Time
}

func (u User) CheckPassword(plainPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plainPassword))
}

type UserSetting struct {
	ThemeMode        string
	PushNotification bool
}
