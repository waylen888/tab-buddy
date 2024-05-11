package model

import "time"

type Group struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	ConvertToTwd bool      `json:"convertToTwd"`
	CreateAt     time.Time `json:"createAt"`
	UpdateAt     time.Time `json:"updateAt"`
}

type Expense struct {
	ID          string    `json:"id"`
	Amount      string    `json:"amount"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	Currency    Currency  `json:"currency"`
	Category    string    `json:"category"`
	TWDRate     string    `json:"twdRate"`
	CreateAt    time.Time `json:"createAt"`
	UpdateAt    time.Time `json:"updateAt"`
	CreatedBy   User      `json:"createdBy"`
}

type ExpenseWithSplitUsers struct {
	Expense
	SplitUsers []SplitUser `json:"splitUsers"`
}

type GroupExpense struct {
	Expense
	Currency   Currency    `json:"currency"`
	SplitUsers []SplitUser `json:"splitUsers"`
}

type SplitUser struct {
	User
	Paid   bool   `json:"paid"`
	Owed   bool   `json:"owed"`
	Amount string `json:"amount"`
}

type GroupMember struct {
	User
	Amount string `json:"amount"`
}
