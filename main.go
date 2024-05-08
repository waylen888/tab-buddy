package main

import (
	"context"
	"flag"
	"log/slog"
	"os"

	"github.com/waylen888/tab-buddy/db/sqlite"
	"github.com/waylen888/tab-buddy/server"
	"golang.org/x/sync/errgroup"
)

var (
	databasePath = flag.String("database-path", "./tabbuddy.sqlite", "database path")
)

func main() {
	flag.Parse()
	slog.Info("start tabbuddy", "database-path", *databasePath)
	db, err := sqlite.New(context.TODO(), *databasePath)
	if err != nil {
		slog.Error("open sqlite", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	g, ctx := errgroup.WithContext(context.Background())
	g.Go(func() error {
		server := server.New(db)
		return server.Run(ctx, ":8080")
	})
	if err := g.Wait(); err != nil {
		slog.Error("run server", "error", err)
		os.Exit(1)
	}
}
