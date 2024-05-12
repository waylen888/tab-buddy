package entity

import "time"

type Comment struct {
	ID          string
	ExpenseID   string
	Content     string
	CreateBy    string
	DisplayName string
	CreateAt    time.Time
	UpdateAt    time.Time
}

type CreateCommentArguments struct {
	ExpenseID string
	Content   string
	CreateBy  string
}

type DeleteCommentArguments struct {
	ID     string
	UserID string
}
