import { Stack, Typography } from "@mui/material"
import { useAuth } from "../components/AuthProvider"
import { Currency, GroupExpense, User } from "../model"
import FormattedAmount, { format } from "../components/FormattedAmount"
import { useTranslation } from "react-i18next"

const GroupDebt: React.FC<{
  expenses: GroupExpense[] | undefined
}> = ({ expenses }) => {
  const { user: me } = useAuth()
  const { t } = useTranslation()

  const summaries = expenses?.reduce((pv, expense) => {
    if (!pv.sums[expense.currency.code]) {
      pv.sums[expense.currency.code] = {
        currency: expense.currency,
        amount: 0,
      }
    }
    pv.sums[expense.currency.code].amount += Number(expense.amount)

    if (!pv.debts[expense.currency.code]) {
      pv.debts[expense.currency.code] = {
        currency: expense.currency,
        debtor: {},
      }
    }

    const paidUser = expense.splitUsers.find(u => u.paid);
    // console.debug(`expense`, expense.description, `found paid user`, paidUser.displayName)
    if (paidUser?.id === me.id) {
      pv.debts[expense.currency.code] = expense.splitUsers.filter(user => user.id !== me.id).reduce((pv, cv, _, splitUsers) => {
        if (!pv.debtor[cv.id]) {
          pv.debtor[cv.id] = {
            user: cv,
            amount: 0,
          }
        }
        pv.debtor[cv.id].amount -= Number(cv.amount)

        return pv
      }, pv.debts[expense.currency.code])
    } else if (paidUser) {
      pv.debts[expense.currency.code] = expense.splitUsers.filter(user => user.id === me.id).reduce((pv, cv, _, splitUsers) => {
        if (!pv.debtor[paidUser.id]) {
          pv.debtor[paidUser.id] = {
            user: paidUser,
            amount: 0,
          }
        }
        pv.debtor[paidUser.id].amount += Number(cv.amount)
        return pv
      }, pv.debts[expense.currency.code])
    }

    return pv
  }, {
    sums: {},
    debts: {},
  } as {
    sums: {
      [key: string]: {
        currency: Currency;
        amount: number;
      }
    },
    debts: {
      [key: string]: {
        currency: Currency,
        debtor: {
          [key: string]: {
            user: User;
            amount: number;
          }
        }
      }
    }
  })

  let row = [] as { currency: Currency, name: string, amount: string }[]
  let sums = [] as { currency: Currency, amount: string }[]
  for (const k in summaries?.sums) {
    const sum = summaries.sums[k]
    sums.push({
      currency: sum.currency,
      amount: (sum.amount).toFixed(sum.currency.decimalDigits),
    })
  }

  for (const k in summaries?.debts) {
    const debt = summaries.debts[k]
    const debtors = debt.debtor
    for (const kk in debtors) {
      const debtor = debtors[kk]
      // if (debtor.amount < 0) {
      row.push({
        currency: debt.currency,
        name: debtor.user.displayName,
        amount: (debtor.amount).toFixed(debt.currency.decimalDigits),
      })
      // }
    }
  }
  return (
    <>
      <Typography variant="h5">
        {t("group.total_expense")}
        {
          sums.map((sum) => format(sum.amount, sum.currency.code)).join(" + ")
        }
      </Typography>
      {
        row.map((debt, index) => {
          return (
            <Stack direction="row" gap={1} key={index}>
              {
                debt.amount.startsWith("-")
                  ? (
                    <Typography sx={{ color: "orange" }}>{t("group.you_owes")} {debt.name}
                      <FormattedAmount currency={debt.currency} value={debt.amount} />
                    </Typography>
                  )
                  : (
                    <Typography sx={{ color: "green" }}>{debt.name} {t("group.owes_you")}
                      <FormattedAmount currency={debt.currency} value={debt.amount} />
                    </Typography>
                  )
              }

            </Stack>
          )
        })
      }
    </>
  )
}

export default GroupDebt