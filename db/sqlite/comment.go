package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/rs/xid"
	"github.com/waylen888/tab-buddy/db/entity"
)

func (s *sqlite) GetExpenseComments(expenseID string) ([]entity.Comment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()
	comments := make([]entity.Comment, 0)
	return comments, sqlscan.Select(ctx, s.rwDB, &comments,
		`
		SELECT 
			ec.id, ec.content, ec.create_by, ec.create_at, ec.update_at, user.display_name
		FROM expense_comment ec
		JOIN user ON ec.create_by = user.id
		WHERE ec.expense_id = @expense_id 
		ORDER BY ec.create_at DESC`,
		sql.Named("expense_id", expenseID),
	)
}

func (s *sqlite) CreateComment(args entity.CreateCommentArguments) (entity.Comment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()

	user, err := s.GetUser(args.CreateBy)
	if err != nil {
		return entity.Comment{}, err
	}

	now := time.Now()
	comment := entity.Comment{
		ID:          xid.NewWithTime(now).String(),
		ExpenseID:   args.ExpenseID,
		Content:     args.Content,
		CreateBy:    args.CreateBy,
		CreateAt:    now,
		DisplayName: user.DisplayName,
	}
	_, err = s.rwDB.ExecContext(ctx,
		`INSERT INTO expense_comment (id, expense_id, content, create_by, create_at, update_at) 
		VALUES (@id, @expense_id, @content, @create_by, @create_at, @update_at)`,
		sql.Named("id", comment.ID),
		sql.Named("expense_id", comment.ExpenseID),
		sql.Named("content", comment.Content),
		sql.Named("create_by", comment.CreateBy),
		sql.Named("create_at", comment.CreateAt),
		sql.Named("update_at", comment.UpdateAt),
	)
	return comment, err
}
