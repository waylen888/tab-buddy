package calc

import "github.com/shopspring/decimal"

type TWDBool bool

func (b TWDBool) ToTWD(amount string, rate string, digitals int) string {
	if !b {
		return amount
	}
	dAmount, _ := decimal.NewFromString(amount)
	dRate, _ := decimal.NewFromString(rate)
	return dAmount.Mul(dRate).StringFixed(int32(digitals))
}

func (b TWDBool) Bool() bool {
	return bool(b)
}
