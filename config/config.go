package config

import (
	"os"

	"github.com/pelletier/go-toml/v2"
)

type Config struct {
	GoogleOAuth GoogleOAuth `toml:"google_oauth"`
	HTTPSetting HTTPSetting `toml:"http_setting"`
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
		cfg.HTTPSetting.Listen = ":8080"
	}
	return cfg, nil
}
