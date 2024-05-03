package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/waylen888/tab-buddy/db/sqlite"
	"github.com/waylen888/tab-buddy/server"
	"golang.org/x/sync/errgroup"
)

func main() {
	slog.Info("start tabbuddy")
	db, err := sqlite.New(context.TODO(), "./debug-data/tabbuddy.sqlite")
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
