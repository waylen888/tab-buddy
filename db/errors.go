package db

import "errors"

var (
	ErrUserAlreadyInGroup  = errors.New("user already in group")
	ErrUserStillHasExpense = errors.New("the user still has outstanding expenses")
)
