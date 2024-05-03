package entity

import "time"

type Expense struct {
	ID          string
	Description string
	Amount      string
	CreateAt    time.Time
	UpdateAt    time.Time
}
