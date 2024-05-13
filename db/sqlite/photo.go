package sqlite

import (
	"context"
	"database/sql"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/waylen888/tab-buddy/db/entity"
)

func (s *sqlite) CreateExpensePhotos(args entity.CreateExpensePhotosArguments) error {
	return s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		for _, photo := range args.Photos {
			_, err := tx.ExecContext(ctx, `
			INSERT INTO expense_photo (id, expense_id, filename, size, mime, create_at, update_at) 
			VALUES (@id, @expense_id, @filename, @size, @mime, @create_at, @update_at);`,
				sql.Named("id", photo.ID),
				sql.Named("expense_id", args.ExpenseID),
				sql.Named("filename", photo.Filename),
				sql.Named("size", photo.Size),
				sql.Named("mime", photo.MIME),
				sql.Named("create_at", photo.CreateAt),
				sql.Named("update_at", photo.UpdateAt),
			)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *sqlite) GetExpensePhotos(expenseID string) ([]entity.ExpensePhoto, error) {
	eps := make([]entity.ExpensePhoto, 0)
	return eps, s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		return sqlscan.Select(ctx, tx, &eps, `
		SELECT id, filename, size, mime, create_at, update_at
		FROM expense_photo
		WHERE expense_id = @expense_id;`,
			sql.Named("expense_id", expenseID),
		)
	})
}

func (s *sqlite) GetExpensePhoto(ID string) (entity.ExpensePhoto, error) {
	var ep entity.ExpensePhoto
	return ep, s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		return sqlscan.Get(ctx, tx, &ep, `
		SELECT id, filename, size, mime, create_at, update_at
		FROM expense_photo
		WHERE id = @id;`,
			sql.Named("id", ID),
		)
	})
}
