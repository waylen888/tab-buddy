package entity

import "time"

type Expense struct {
	ID           string    `db:"id"`
	Amount       string    `db:"amount"`
	Description  string    `db:"description"`
	Date         time.Time `db:"date"`
	CurrencyCode string    `db:"currency_code"`
	CreateAt     time.Time `db:"create_at"`
	UpdateAt     time.Time `db:"update_at"`
	CreatedBy    string    `db:"created_by"`
}

type ExpenseWithSplitUser struct {
	Expense
	SplitUsers []SplitUser
}

type SplitUser struct {
	User
	Owed   bool
	Paid   bool
	Amount string
}

type CreateExpenseArguments struct {
	GroupID        string
	Amount         string
	Description    string
	Date           time.Time
	CurrencyCode   string
	SplitUsers     []SplitUser
	CreateByUserID string
}
