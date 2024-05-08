package calc

import (
	"github.com/samber/lo"
	"github.com/shopspring/decimal"
	"github.com/waylen888/tab-buddy/db/entity"
)

func SplitValue(expenseAmount string, splitUsers []entity.SplitUser, userID string) (sum decimal.Decimal) {
	amount, _ := decimal.NewFromString(expenseAmount)
	// numberOfUsers := decimal.NewFromInt(int64(len(splitUsers)))
	owedUserCount := decimal.NewFromInt(lo.SumBy(splitUsers, func(user entity.SplitUser) int64 {
		if user.Owed {
			return 1
		}
		return 0
	}))
	avg := amount.Div(owedUserCount)
	one := decimal.NewFromInt(1)
	zero := decimal.NewFromInt(0)
	if owedUserCount.Equal(zero) {
		return
	}
	for _, user := range splitUsers {
		if user.ID != userID {
			continue
		}
		if user.Paid {
			if owedUserCount.Equal(one) {
				if user.Owed {
					// me paid and me owed
					// do nothing
				} else {
					sum = sum.Add(amount)
				}
			} else {
				// avg * (numberOfUsers - 1)
				sum = sum.Add(avg.Mul(owedUserCount.Sub(one)))
			}
		} else if user.Owed {
			sum = sum.Sub(amount.Div(owedUserCount))
		}
	}
	return
}
