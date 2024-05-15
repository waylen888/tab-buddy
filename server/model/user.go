package model

import "time"

type User struct {
	ID          string    `json:"id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"displayName"`
	Email       string    `json:"email"`
	CreateAt    time.Time `json:"createAt"`
	UpdateAt    time.Time `json:"updateAt"`
}

type UserSetting struct {
	ThemeMode        string `json:"themeMode"`
	PushNotification bool   `json:"pushNotification"`
}
