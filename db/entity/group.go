package entity

import "time"

type Group struct {
	ID       string
	Name     string
	CreateAt time.Time
	UpdateAt time.Time
}
