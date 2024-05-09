package entity

import "time"

type Expense struct {
	ID           string    `db:"id"`
	Amount       string    `db:"amount"`
	Description  string    `db:"description"`
	Date         time.Time `db:"date"`
	CurrencyCode string    `db:"currency_code"`
	Category     string    `db:"category"`
	TWDRate      string    `db:"twd_rate"`
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
	TWDRate        string
	Description    string
	Date           time.Time
	CurrencyCode   string
	Category       string
	SplitUsers     []SplitUser
	CreateByUserID string
}
