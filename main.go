package main

import (
	"context"
	"flag"
	"fmt"
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

	slog.Info("create data store dir", "dir", cfg.DataDir)
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		slog.Error("create data store dir", "error", err)
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
		server, err := server.New(db, cfg)
		if err != nil {
			return fmt.Errorf("new server: %w", err)
		}
		return server.Run(ctx, cfg.HTTPSetting)
	})

	if err := g.Wait(); err != nil {
		slog.Error("run server", "error", err)
		os.Exit(1)
	}
}
