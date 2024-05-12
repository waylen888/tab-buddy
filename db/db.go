package db

import (
	"github.com/waylen888/tab-buddy/db/entity"
)

type Database interface {
	GetUser(ID string) (entity.User, error)
	GetUserByUsername(username string) (entity.User, error)
	CreateUser(username, displayName, email, password string, createType entity.UserCreateType) (entity.User, error)

	GetGroups(userID string) ([]entity.Group, error)
	GetGroup(ID string, userID string) (entity.Group, error)
	CreateGroup(name string, ownerID string) (entity.Group, error)
	UpdateGroup(ID string, name string, convertToTwd bool) (entity.Group, error)
	DeleteGroup(ID string) error
	GetGroupMembers(ID string) ([]entity.User, error)
	AddUserToGroupByUsername(groupID string, username *string, email *string) error

	GetGroupExpenses(groupID string) ([]entity.ExpenseWithSplitUser, error)
	GetExpense(ID string) (entity.ExpenseWithSplitUser, error)
	CreateExpense(arg entity.CreateExpenseArguments) (entity.Expense, error)
	UpdateExpense(arg entity.UpdateExpenseArguments) (entity.Expense, error)

	GetCurrency(code string) (entity.Currency, error)
	GetCurrencies() ([]entity.Currency, error)

	CreateComment(args entity.CreateCommentArguments) (entity.Comment, error)
	DeleteComment(args entity.DeleteCommentArguments) error
	GetExpenseComments(expenseID string) ([]entity.Comment, error)
	Close() error
}
