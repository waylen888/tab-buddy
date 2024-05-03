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
	lo.T2("user", `
CREATE TABLE IF NOT EXISTS "user" (
  "id"	TEXT NOT NULL,
  "name"	TEXT NOT NULL,
  "create_at" DATETIME NOT NULL,
  "update_at" DATETIME NOT NULL,
  PRIMARY KEY("id")
);`),
	lo.T2("expense", `
CREATE TABLE IF NOT EXISTS "expense" (
  "id"	TEXT NOT NULL,
  "description"	TEXT NOT NULL,
	"amount"	TEXT NOT NULL,
  "create_at" DATETIME NOT NULL,
  "update_at" DATETIME NOT NULL,
  PRIMARY KEY("id")
);`),
	lo.T2("expense", `
CREATE TABLE IF NOT EXISTS "group_expense" (
  "group_id"	TEXT NOT NULL,
  "expense_id"	TEXT NOT NULL,
  PRIMARY KEY("group_id", "expense_id")
);`),
}
