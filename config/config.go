package config

import (
	"os"
	"path/filepath"

	"github.com/pelletier/go-toml/v2"
)

type Config struct {
	GoogleOAuth   GoogleOAuth `toml:"google_oauth"`
	HTTPSetting   HTTPSetting `toml:"http_setting"`
	PhotoStoreDir string      `toml:"photo_store_dir"`
}

type GoogleOAuth struct {
	ClientID     string `toml:"client_id"`
	ClientSecret string `toml:"client_secret"`
	RedirectURL  string `toml:"redirect_url"`
}

type HTTPSetting struct {
	Listen       string `toml:"listen"`
	CertFilePath string `toml:"cert_filepath"`
	KeyFilePath  string `toml:"key_filepath"`
}

func New(cfgPath string) (Config, error) {
	file, err := os.Open(cfgPath)
	if err != nil {
		return Config{}, err
	}
	defer file.Close()
	var cfg Config
	if err := toml.NewDecoder(file).Decode(&cfg); err != nil {
		return Config{}, err
	}
	if cfg.HTTPSetting.Listen == "" {
		cfg.HTTPSetting.Listen = ":8081"
	}

	if cfg.PhotoStoreDir == "" {
		wd, _ := os.Getwd()
		cfg.PhotoStoreDir = filepath.Join(wd, "./photos")
	} else if !filepath.IsAbs(cfg.PhotoStoreDir) {
		cfg.PhotoStoreDir, _ = filepath.Abs(cfg.PhotoStoreDir)
	}

	return cfg, nil
}
