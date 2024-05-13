package entity

import "time"

type CreateExpensePhotosArguments struct {
	ExpenseID string
	Photos    []ExpensePhoto
}

type ExpensePhoto struct {
	ID       string
	Filename string
	Size     int64
	MIME     string
	CreateAt time.Time
	UpdateAt time.Time
}
