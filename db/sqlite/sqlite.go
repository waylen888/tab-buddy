package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/samber/lo"
	"github.com/waylen888/tab-buddy/db"
)

var defaultTimeout = time.Second * 5

type sqlite struct {
	rwDB    *sql.DB
	timeout time.Duration
}

func New(ctx context.Context, filePath string) (db.Database, error) {
	var rwDSN string
	if filePath != "" {
		rwOpts := []string{
			"_fk=on",
		}
		rwDSN = fmt.Sprintf("file:%s?%s", filePath, strings.Join(rwOpts, "&"))
	} else {
		inMemPath := fmt.Sprintf("file:/%s", lo.RandomString(20, []rune("abcdedfghijklmnopqrstABCDEFGHIJKLMNOP")))
		rwOpts := []string{
			"mode=rw",
			"vfs=memdb",
			"_txlock=deferred",
			"_fk=on",
		}
		rwDSN = fmt.Sprintf("%s?%s", inMemPath, strings.Join(rwOpts, "&"))
	}

	rwDB, err := sql.Open("sqlite3", rwDSN)
	if err != nil {
		return nil, err
	}
	rwDB.SetMaxOpenConns(1)

	if err := rwDB.Ping(); err != nil {
		return nil, err
	}

	sqlite := &sqlite{
		rwDB:    rwDB,
		timeout: defaultTimeout,
	}
	if err := sqlite.initialize(ctx); err != nil {
		return nil, err
	}

	return sqlite, nil
}

func (s *sqlite) Close() error {
	return s.rwDB.Close()
}

func (s *sqlite) WithTx(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tx, err := s.rwDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if v := recover(); v != nil {
			tx.Rollback()
			panic(v)
		}
	}()
	if err := fn(tx); err != nil {
		if rerr := tx.Rollback(); rerr != nil {
			err = fmt.Errorf("%w: rolling back transaction: %v", err, rerr)
		}
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}
	return nil
}

func (s *sqlite) initialize(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	tx, err := s.rwDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	for _, tableScheme := range tableSchemes {
		_, err = tx.ExecContext(ctx, tableScheme.B)
		if err != nil {
			return fmt.Errorf("create table (%s): %w", tableScheme.A, err)
		}
	}
	if err := s.prepareCurrency(ctx, tx); err != nil {
		return fmt.Errorf("prepareCurrency: %w", err)
	}
	return tx.Commit()
}

var tableSchemes = []lo.Tuple2[string, string]{
	lo.T2("group", `
CREATE TABLE IF NOT EXISTS "group" (
  "id"	TEXT NOT NULL,
  "name"	TEXT NOT NULL,
  "create_at" DATETIME NOT NULL,
  "update_at" DATETIME NOT NULL,
  PRIMARY KEY("id")
);`),
	lo.T2("group_member", `
CREATE TABLE IF NOT EXISTS "group_member" (
	"group_id"	TEXT NOT NULL,
	"user_id"	TEXT NOT NULL,
	FOREIGN KEY("group_id") REFERENCES "group"("id") ON DELETE CASCADE,
	FOREIGN KEY("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
	PRIMARY KEY("group_id", "user_id")
);`),
	lo.T2("user", `
CREATE TABLE IF NOT EXISTS "user" (
  "id"	TEXT NOT NULL,
	"username" TEXT NOT NULL UNIQUE,
  "display_name"	TEXT NOT NULL,
	"password" TEXT NOT NULL,
	"email" TEXT NOT NULL,
  "create_at" DATETIME NOT NULL,
  "update_at" DATETIME NOT NULL,
  PRIMARY KEY("id")
);`),
	lo.T2("expense", `
CREATE TABLE IF NOT EXISTS "expense" (
  "id"	TEXT NOT NULL,
  "description"	TEXT NOT NULL,
	"amount"	TEXT NOT NULL,
	"date" DATETIME NOT NULL,
	"currency" TEXT NOT NULL,
  "create_at" DATETIME NOT NULL,
  "update_at" DATETIME NOT NULL,
	"created_by" TEXT NOT NULL,
  PRIMARY KEY("id")
);`),
	lo.T2("group_expense", `
CREATE TABLE IF NOT EXISTS "group_expense" (
  "group_id"	TEXT NOT NULL,
  "expense_id"	TEXT NOT NULL,
	FOREIGN KEY("group_id") REFERENCES "group"("id") ON DELETE CASCADE,
	FOREIGN KEY("expense_id") REFERENCES "expense"("id") ON DELETE CASCADE,
  PRIMARY KEY("group_id", "expense_id")
);`),
	lo.T2("user_expense", `
CREATE TABLE IF NOT EXISTS "user_expense" (
  "user_id"	TEXT NOT NULL,
  "expense_id"	TEXT NOT NULL,
	"type"	INTEGER NOT NULL,
	"value" TEXT NOT NULL,
	"paid"  BOOLEAN NOT NULL DEFAULT 0,
	FOREIGN KEY("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
	FOREIGN KEY("expense_id") REFERENCES "expense"("id") ON DELETE CASCADE,
  PRIMARY KEY("user_id", "expense_id")
);`),
}
