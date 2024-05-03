package db

import "github.com/waylen888/tab-buddy/db/entity"

type Database interface {
	GetGroups() ([]entity.Group, error)
	GetGroup(ID string) (entity.Group, error)
	CreateGroup(name string) (entity.Group, error)
	UpdateGroup(ID string, name string) (entity.Group, error)
	DeleteGroup(ID string) error

	GetExpenses(groupID string) ([]entity.Expense, error)
	CreateExpense(groupID string, amount string, description string) (entity.Expense, error)

	Close() error
}
