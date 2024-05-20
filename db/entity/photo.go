package entity

import "time"

type CreateExpenseAttachmentsArgument struct {
	ExpenseID   string
	Attachments []ExpenseAttachment
}

type ExpenseAttachment struct {
	ID       string
	Filename string
	Size     int64
	MIME     string
	CreateAt time.Time
	UpdateAt time.Time
}
