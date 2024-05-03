package model

import "time"

type Group struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	CreateAt time.Time `json:"createAt"`
	UpdateAt time.Time `json:"updateAt"`
}

type Expense struct {
	ID          string    `json:"id"`
	Amount      string    `json:"amount"`
	Description string    `json:"description"`
	CreateAt    time.Time `json:"createAt"`
	UpdateAt    time.Time `json:"updateAt"`
}
