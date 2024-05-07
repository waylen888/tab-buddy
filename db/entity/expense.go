package entity

import "time"

type Expense struct {
	ID          string
	Description string
	Amount      string
	Date        time.Time
	CreateAt    time.Time
	UpdateAt    time.Time
	CreatedBy   string
}

type ExpenseWithSplitUser struct {
	Expense
	SplitUsers []SplitUser
}

type SplitUser struct {
	User
	ID   string
	Paid bool
}

type CreateExpenseArguments struct {
	GroupID        string
	Amount         string
	Description    string
	Date           time.Time
	Currency       string
	SplitUsers     []SplitUser
	CreateByUserID string
}
