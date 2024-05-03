package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/rs/xid"
	"github.com/waylen888/tab-buddy/db/entity"
)

func (s *sqlite) GetGroups() ([]entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var groups []entity.Group

	if err := sqlscan.Select(
		ctx, s.rwDB, &groups,
		`SELECT id, name, create_at, update_at FROM "group";`,
	); err != nil {
		return nil, err
	}
	return groups, nil
}

func (s *sqlite) GetGroup(ID string) (entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	group := entity.Group{}
	if err := sqlscan.Get(
		ctx, s.rwDB, &group,
		`SELECT * FROM "group" WHERE id = @id`,
		sql.Named("id", ID),
	); err != nil {
		return entity.Group{}, err
	}
	return group, nil
}

func (s *sqlite) CreateGroup(name string) (entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	group := entity.Group{
		ID:       xid.New().String(),
		Name:     name,
		CreateAt: time.Now(),
	}
	_, err := s.rwDB.ExecContext(
		ctx,
		`INSERT INTO "group" (id, name, create_at, update_at) VALUES (@id, @name, @create_at, @update_at)`,
		sql.Named("id", group.ID),
		sql.Named("name", group.Name),
		sql.Named("create_at", group.CreateAt),
		sql.Named("update_at", group.UpdateAt),
	)
	return group, err
}

func (s *sqlite) UpdateGroup(ID string, name string) (entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var group entity.Group
	err := sqlscan.Get(
		ctx, s.rwDB, &group,
		`UPDATE "group" SET name = @name, update_at = @update_at WHERE id = @id RETURNING *`,
		sql.Named("id", ID),
		sql.Named("name", name),
		sql.Named("update_at", time.Now()),
	)
	return group, err
}

func (s *sqlite) DeleteGroup(ID string) error {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	_, err := s.rwDB.ExecContext(
		ctx,
		`DELETE FROM "group" WHERE id = @id`,
		sql.Named("id", ID),
	)
	return err
}

func (s *sqlite) GetExpenses(groupID string) ([]entity.Expense, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var expenses []entity.Expense

	if err := sqlscan.Select(
		ctx, s.rwDB, &expenses,
		`SELECT id, amount, description, create_at, update_at 
		FROM expense 
		JOIN group_expense ON expense.id = group_expense.expense_id 
			AND group_expense.group_id = @group_id
		WHERE group_id = @group_id`,
		sql.Named("group_id", groupID),
	); err != nil {
		return nil, err
	}
	return expenses, nil
}

func (s *sqlite) CreateExpense(groupID string, amount string, description string) (entity.Expense, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	expense := entity.Expense{
		ID:          xid.New().String(),
		Amount:      amount,
		Description: description,
		CreateAt:    time.Now(),
	}
	tx, err := s.rwDB.BeginTx(ctx, nil)
	if err != nil {
		return expense, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(
		ctx,
		`INSERT INTO expense (id, amount, description, create_at, update_at) VALUES (@id, @amount, @description, @create_at, @update_at)`,
		sql.Named("id", expense.ID),
		sql.Named("amount", expense.Amount),
		sql.Named("description", expense.Description),
		sql.Named("create_at", expense.CreateAt),
		sql.Named("update_at", expense.UpdateAt),
	)
	if err != nil {
		return expense, err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO group_expense(group_id, expense_id) VALUES (@group_id, @expense_id);`,
		sql.Named("group_id", groupID),
		sql.Named("expense_id", expense.ID),
	)
	if err != nil {
		return expense, err
	}
	return expense, tx.Commit()
}
