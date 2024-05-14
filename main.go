package main

import (
	"context"
	"flag"
	"log/slog"
	"os"

	"github.com/waylen888/tab-buddy/config"
	"github.com/waylen888/tab-buddy/db/sqlite"
	"github.com/waylen888/tab-buddy/server"
	"golang.org/x/sync/errgroup"
)

var (
	databasePath = flag.String("database-path", "./tabbuddy.sqlite", "database path")
	cfgPath      = flag.String("config.file", "./config.toml", "config path")
)

func main() {
	flag.Parse()

	slog.Info("start tabbuddy")

	slog.Info("load config", "path", *cfgPath)
	cfg, err := config.New(*cfgPath)
	if err != nil {
		slog.Error("load config", "error", err)
		os.Exit(1)
	}

	slog.Info("create photo store dir", "dir", cfg.PhotoStoreDir)
	if err := os.MkdirAll(cfg.PhotoStoreDir, 0755); err != nil {
		slog.Error("create photo store dir", "error", err)
		os.Exit(1)
	}

	slog.Info("open sqlite", "path", *databasePath)
	db, err := sqlite.New(context.TODO(), *databasePath)
	if err != nil {
		slog.Error("open sqlite", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	g, ctx := errgroup.WithContext(context.Background())
	g.Go(func() error {
		return server.New(db, cfg).Run(ctx, cfg.HTTPSetting)
	})
	if err := g.Wait(); err != nil {
		slog.Error("run server", "error", err)
		os.Exit(1)
	}
}
