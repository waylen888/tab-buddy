package sqlite

import (
	"context"
	"database/sql"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/waylen888/tab-buddy/db/entity"
)

func (s *sqlite) CreateExpenseAttachments(args entity.CreateExpenseAttachmentsArgument) error {
	return s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		for _, attachment := range args.Attachments {
			_, err := tx.ExecContext(ctx, `
			INSERT INTO expense_attachment (id, expense_id, filename, size, mime, create_at, update_at) 
			VALUES (@id, @expense_id, @filename, @size, @mime, @create_at, @update_at);`,
				sql.Named("id", attachment.ID),
				sql.Named("expense_id", args.ExpenseID),
				sql.Named("filename", attachment.Filename),
				sql.Named("size", attachment.Size),
				sql.Named("mime", attachment.MIME),
				sql.Named("create_at", attachment.CreateAt),
				sql.Named("update_at", attachment.UpdateAt),
			)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *sqlite) GetExpenseAttachments(expenseID string) ([]entity.ExpenseAttachment, error) {
	eps := make([]entity.ExpenseAttachment, 0)
	return eps, s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		return sqlscan.Select(ctx, tx, &eps, `
			SELECT id, filename, size, mime, create_at, update_at
			FROM expense_attachment
			WHERE expense_id = @expense_id;`,
			sql.Named("expense_id", expenseID),
		)
	})
}

func (s *sqlite) GetExpenseAttachment(ID string) (entity.ExpenseAttachment, error) {
	var ep entity.ExpenseAttachment
	return ep, s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		return sqlscan.Get(ctx, tx, &ep, `
		SELECT id, filename, size, mime, create_at, update_at
		FROM expense_attachment
		WHERE id = @id;`,
			sql.Named("id", ID),
		)
	})
}

func (s *sqlite) DeleteExpenseAttachment(ID string) error {
	return s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		_, err := tx.ExecContext(ctx, `
		DELETE FROM expense_attachment
		WHERE id = @id;`,
			sql.Named("id", ID),
		)
		return err
	})
}
