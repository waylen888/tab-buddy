package entity

import (
	"time"

	"github.com/waylen888/tab-buddy/calc"
)

type Group struct {
	ID           string
	Name         string
	ConvertToTwd calc.TWDBool
	CreateAt     time.Time
	UpdateAt     time.Time
}
