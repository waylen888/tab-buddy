package config

import (
	"os"

	"github.com/pelletier/go-toml/v2"
)

type Config struct {
	GoogleOAuth GoogleOAuth `toml:"google_oauth"`
}

type GoogleOAuth struct {
	ClientID     string `toml:"client_id"`
	ClientSecret string `toml:"client_secret"`
	RedirectURL  string `toml:"redirect_url"`
}

func New(cfgPath string) (Config, error) {
	file, err := os.Open(cfgPath)
	if err != nil {
		return Config{}, err
	}
	defer file.Close()
	var cfg Config
	return cfg, toml.NewDecoder(file).Decode(&cfg)
}
