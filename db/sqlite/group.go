package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/mattn/go-sqlite3"
	"github.com/rs/xid"
	"github.com/samber/lo"
	"github.com/waylen888/tab-buddy/calc"
	"github.com/waylen888/tab-buddy/db"
	"github.com/waylen888/tab-buddy/db/entity"
)

func (s *sqlite) GetGroups(userID string) ([]entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var groups []entity.Group

	if err := sqlscan.Select(
		ctx, s.rwDB, &groups, `
		SELECT id, name, create_at, update_at 
		FROM "group" 
		WHERE id IN (SELECT group_id FROM group_member WHERE user_id = @user_id);`,
		sql.Named("user_id", userID),
	); err != nil {
		return nil, err
	}
	return groups, nil
}

func (s *sqlite) GetGroup(ID string, userID string) (entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	group := entity.Group{}
	if err := sqlscan.Get(
		ctx, s.rwDB, &group, `
		SELECT * 
		FROM "group" 
		WHERE id = @id 
		AND id IN (SELECT group_id FROM group_member WHERE user_id = @user_id);`,
		sql.Named("id", ID),
		sql.Named("user_id", userID),
	); err != nil {
		return entity.Group{}, err
	}
	return group, nil
}

func (s *sqlite) CreateGroup(name string, ownerID string) (entity.Group, error) {
	if ownerID == "" {
		return entity.Group{}, fmt.Errorf("ownerID is empty")
	}

	group := entity.Group{
		ID:       xid.New().String(),
		Name:     name,
		CreateAt: time.Now(),
	}
	return group, s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		_, err := tx.ExecContext(
			ctx,
			`INSERT INTO "group" (id, name, create_at, update_at) VALUES (@id, @name, @create_at, @update_at)`,
			sql.Named("id", group.ID),
			sql.Named("name", group.Name),
			sql.Named("create_at", group.CreateAt),
			sql.Named("update_at", group.UpdateAt),
		)
		if err != nil {
			return fmt.Errorf("insert into group: %w", err)
		}
		_, err = tx.ExecContext(
			ctx,
			`INSERT INTO group_member (group_id, user_id) VALUES (@group_id, @user_id)`,
			sql.Named("group_id", group.ID),
			sql.Named("user_id", ownerID),
		)
		return err
	})
}

func (s *sqlite) UpdateGroup(ID string, name string, convertToTwd bool) (entity.Group, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var group entity.Group
	err := sqlscan.Get(
		ctx, s.rwDB, &group,
		`UPDATE "group" 
		SET name = @name, 
		convert_to_twd = @convert_to_twd,
		update_at = @update_at
		WHERE id = @id RETURNING *`,
		sql.Named("id", ID),
		sql.Named("name", name),
		sql.Named("convert_to_twd", convertToTwd),
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

func (s *sqlite) GetGroupExpenses(groupID string) ([]entity.ExpenseWithSplitUser, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var expenses []entity.ExpenseWithSplitUser

	if err := sqlscan.Select(
		ctx, s.rwDB, &expenses,
		`SELECT id, amount, description, date, currency_code, category, twd_rate, create_at, update_at, created_by
		FROM expense 
		JOIN group_expense 
			ON expense.id = group_expense.expense_id 
		WHERE group_id = @group_id
		ORDER BY "date" DESC, "create_at" ASC
		`,
		sql.Named("group_id", groupID),
	); err != nil {
		return nil, err
	}

	for i := range expenses {
		expense := &expenses[i]
		err := sqlscan.Select(
			ctx, s.rwDB, &expense.SplitUsers,
			`SELECT id, username, display_name, email, create_at, update_at, paid, owed, amount
			FROM user JOIN user_expense
			ON user.id = user_expense.user_id 
			WHERE user_expense.expense_id = @id`,
			sql.Named("id", expense.ID),
		)
		if err != nil {
			return expenses, err
		}
	}
	return expenses, nil
}

func (s *sqlite) GetExpense(ID string) (entity.ExpenseWithSplitUser, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()

	var expense entity.ExpenseWithSplitUser

	if err := sqlscan.Get(
		ctx, s.rwDB, &expense,
		`SELECT 
		id, amount, description, date, currency_code, category, twd_rate, note, create_at, update_at, created_by
		FROM expense
		WHERE id = @id`,
		sql.Named("id", ID),
	); err != nil {
		return entity.ExpenseWithSplitUser{}, err
	}
	err := sqlscan.Select(
		ctx, s.rwDB, &expense.SplitUsers,
		`SELECT id, username, display_name, email, create_at, update_at, paid, owed
		FROM user JOIN user_expense
		ON user.id = user_expense.user_id 
		WHERE user_expense.expense_id = @id`,
		sql.Named("id", ID),
	)
	return expense, err
}

func (s *sqlite) ExpenseAccessPermissions(userID string, expenseID string) error {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var ok bool
	err := sqlscan.Get(ctx, s.rwDB, &ok, `
		SELECT 1 
		FROM group_member  
		JOIN group_expense 
		ON group_member.group_id = group_expense.group_id
		WHERE group_expense.expense_id = @expense_id AND group_member.user_id = @user_id`,
		sql.Named("expense_id", expenseID),
		sql.Named("user_id", userID),
	)
	return err
}

func (s *sqlite) CreateExpense(args entity.CreateExpenseArguments) (entity.Expense, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()

	currency, err := s.GetCurrency(args.CurrencyCode)
	if err != nil {
		return entity.Expense{}, err
	}
	expense := entity.Expense{
		ID:           xid.New().String(),
		Amount:       args.Amount,
		Description:  args.Description,
		Date:         args.Date,
		CurrencyCode: currency.Code,
		Category:     args.Category,
		TWDRate:      args.TWDRate,
		Note:         args.Note,
		CreateAt:     time.Now(),
		CreatedBy:    args.CreateByUserID,
	}
	tx, err := s.rwDB.BeginTx(ctx, nil)
	if err != nil {
		return expense, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(
		ctx,
		`INSERT INTO expense (id, amount, description, date, currency_code, category, twd_rate, note, create_at, update_at, created_by) 
		VALUES (@id, @amount, @description, @date, @currency_code, @category, @twd_rate, @note, @create_at, @update_at, @created_by)`,
		sql.Named("id", expense.ID),
		sql.Named("amount", expense.Amount),
		sql.Named("description", expense.Description),
		sql.Named("date", expense.Date),
		sql.Named("currency_code", expense.CurrencyCode),
		sql.Named("category", expense.Category),
		sql.Named("twd_rate", expense.TWDRate),
		sql.Named("note", expense.Note),
		sql.Named("create_at", expense.CreateAt),
		sql.Named("update_at", expense.UpdateAt),
		sql.Named("created_by", expense.CreatedBy),
	)
	if err != nil {
		return expense, err
	}
	_, err = tx.ExecContext(ctx, `INSERT INTO group_expense(group_id, expense_id) VALUES (@group_id, @expense_id);`,
		sql.Named("group_id", args.GroupID),
		sql.Named("expense_id", expense.ID),
	)
	if err != nil {
		return expense, err
	}

	for _, user := range args.SplitUsers {
		_, err = tx.ExecContext(
			ctx,
			`INSERT INTO user_expense(user_id, expense_id, type, amount, paid, owed) 
			VALUES (@user_id, @expense_id, @type, @amount, @paid, @owed)`,
			sql.Named("user_id", user.ID),
			sql.Named("expense_id", expense.ID),
			sql.Named("type", 0),
			sql.Named("amount",
				calc.SplitValue(expense.Amount, lo.Map(args.SplitUsers, func(su entity.SplitUser, _ int) calc.SplitUser {
					return calc.SplitUser{
						ID:   su.ID,
						Paid: su.Paid,
						Owed: su.Owed,
					}
				}), user.ID).StringFixed(int32(currency.DecimalDigits)),
			),
			sql.Named("paid", user.Paid),
			sql.Named("owed", user.Owed),
		)
		if err != nil {
			return expense, err
		}
	}
	return expense, tx.Commit()
}

func (s *sqlite) UpdateExpense(args entity.UpdateExpenseArguments) (entity.Expense, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()

	currency, err := s.GetCurrency(args.CurrencyCode)
	if err != nil {
		return entity.Expense{}, err
	}
	var expense entity.Expense
	tx, err := s.rwDB.BeginTx(ctx, nil)
	if err != nil {
		return entity.Expense{}, err
	}
	defer tx.Rollback()

	err = sqlscan.Get(
		ctx,
		tx,
		&expense,
		`
		UPDATE expense 
		SET amount = @amount,
				description = @description,
				date = @date,
				currency_code = @currency_code,
				category = @category,
				twd_rate = @twd_rate,
				note = @note,
				update_at = @update_at
		WHERE id = @id
		RETURNING *;
	`,
		sql.Named("id", args.ExpenseID),
		sql.Named("amount", args.Amount),
		sql.Named("description", args.Description),
		sql.Named("date", args.Date),
		sql.Named("currency_code", args.CurrencyCode),
		sql.Named("category", args.Category),
		sql.Named("twd_rate", args.TWDRate),
		sql.Named("note", args.Note),
		sql.Named("update_at", time.Now()),
	)
	if err != nil {
		return entity.Expense{}, err
	}

	_, err = tx.ExecContext(
		ctx,
		`DELETE FROM user_expense WHERE expense_id = @expense_id`,
		sql.Named("expense_id", args.ExpenseID),
	)
	if err != nil {
		return entity.Expense{}, err
	}

	for _, user := range args.SplitUsers {
		_, err = tx.ExecContext(
			ctx,
			`INSERT INTO user_expense(user_id, expense_id, type, amount, paid, owed) 
			VALUES (@user_id, @expense_id, @type, @amount, @paid, @owed)`,
			sql.Named("user_id", user.ID),
			sql.Named("expense_id", expense.ID),
			sql.Named("type", 0),
			sql.Named("amount",
				calc.SplitValue(expense.Amount, lo.Map(args.SplitUsers, func(su entity.SplitUser, _ int) calc.SplitUser {
					return calc.SplitUser{
						ID:   su.ID,
						Paid: su.Paid,
						Owed: su.Owed,
					}
				}), user.ID).StringFixed(int32(currency.DecimalDigits)),
			),
			sql.Named("paid", user.Paid),
			sql.Named("owed", user.Owed),
		)
		if err != nil {
			return expense, err
		}
	}
	return expense, tx.Commit()
}

func (s *sqlite) GetGroupMembers(ID string) ([]entity.User, error) {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var members []entity.User

	if err := sqlscan.Select(
		ctx, s.rwDB, &members,
		`SELECT *
		FROM "user"
		WHERE id IN (SELECT user_id FROM group_member WHERE group_id = @group_id);`,
		sql.Named("group_id", ID),
	); err != nil {
		return nil, err
	}
	return members, nil
}

func (s *sqlite) AddUserToGroupByUsername(groupID string, username *string, email *string) error {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	_, err := s.rwDB.ExecContext(
		ctx,
		`INSERT INTO group_member (group_id, user_id) 
		VALUES (
			(SELECT id FROM "group" WHERE id = @group_id), 
			(
				SELECT id FROM "user" 
				WHERE 1 = 1 
				AND (1 = (CASE WHEN @username IS NULL THEN 1 ELSE 0 END) OR username = @username)
				AND (1 = (CASE WHEN @email IS NULL THEN 1 ELSE 0 END) OR email = @email)
			)
		)`,
		sql.Named("group_id", groupID),
		sql.Named("username", username),
		sql.Named("email", email),
	)

	var sqliteErr sqlite3.Error
	if errors.As(err, &sqliteErr) && sqliteErr.ExtendedCode == 1555 {
		return db.ErrUserAlreadyInGroup
	}
	return err
}

func (s *sqlite) RemoveMemeberFromGroup(groupID string, userID string) error {
	ctx, cancel := context.WithTimeout(context.TODO(), s.timeout)
	defer cancel()
	var count int
	err := sqlscan.Get(ctx, s.rwDB, &count, `
		SELECT COUNT(*) 
		FROM user_expense 
		WHERE user_id = @user_id 
		AND expense_id IN (
			SELECT expense_id FROM group_expense WHERE group_id = @group_id
		)
		AND (paid = 1 OR owed = 1)`,
		sql.Named("group_id", groupID),
		sql.Named("user_id", userID),
	)
	if err != nil {
		return fmt.Errorf("check user status: %w", err)
	}
	if count > 0 {
		return db.ErrUserStillHasExpense
	}
	return s.WithTx(ctx, func(ctx context.Context, tx *sql.Tx) error {
		_, err = tx.ExecContext(
			ctx,
			`
			DELETE FROM user_expense 
			WHERE user_id = @user_id 
			AND expense_id IN (
				SELECT expense_id FROM group_expense WHERE group_id = @group_id
			);
			`,
			sql.Named("group_id", groupID),
			sql.Named("user_id", userID),
		)
		if err != nil {
			return fmt.Errorf("clean user expense: %w", err)
		}

		_, err = tx.ExecContext(
			ctx,
			`
			DELETE FROM group_member 
			WHERE group_id = @group_id AND user_id = @user_id;
			`,
			sql.Named("group_id", groupID),
			sql.Named("user_id", userID),
		)
		return err
	})
}
