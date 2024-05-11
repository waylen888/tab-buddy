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
	Note         string    `db:"note"`
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
	Note           string
	SplitUsers     []SplitUser
	CreateByUserID string
}

type UpdateExpenseArguments struct {
	GroupID      string
	ExpenseID    string
	Amount       string
	TWDRate      string
	Description  string
	Date         time.Time
	CurrencyCode string
	Category     string
	Note         string
	SplitUsers   []SplitUser
}
