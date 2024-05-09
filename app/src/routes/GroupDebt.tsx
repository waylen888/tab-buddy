import { Stack, Typography } from "@mui/material"
import { useAuth } from "../components/AuthProvider"
import { Currency, GroupExpense, User } from "../model"
import FormattedAmount from "../components/FormattedAmount"

const GroupDebt: React.FC<{
  expenses: GroupExpense[] | undefined
}> = ({ expenses }) => {
  const { user: me } = useAuth()
  const debts = expenses?.reduce((pv, expense) => {
    if (!pv[expense.currency.code]) {
      pv[expense.currency.code] = {
        currency: expense.currency,
        debtor: {},
      }
    }

    const paidUser = expense.splitUsers.find(u => u.paid);
    console.debug(`expense`, expense.description, `found paid user`, paidUser.displayName)
    if (paidUser.id === me.id) {
      pv[expense.currency.code] = expense.splitUsers.filter(user => user.id !== me.id).reduce((pv, cv, _, splitUsers) => {
        if (!pv.debtor[cv.id]) {
          pv.debtor[cv.id] = {
            user: cv,
            amount: 0,
          }
        }
        pv.debtor[cv.id].amount -= Number(cv.amount)

        return pv
      }, pv[expense.currency.code])
    } else {
      pv[expense.currency.code] = expense.splitUsers.filter(user => user.id === me.id).reduce((pv, cv, _, splitUsers) => {
        if (!pv.debtor[paidUser.id]) {
          pv.debtor[paidUser.id] = {
            user: paidUser,
            amount: 0,
          }
        }
        pv.debtor[paidUser.id].amount += Number(cv.amount)
        return pv
      }, pv[expense.currency.code])
    }

    return pv
  }, {} as {
    [key: string]: {
      currency: Currency, debtor: {
        [key: string]: {
          user: User;
          amount: number;
        }
      }
    }
  })

  var row = [] as { currency: Currency, name: string, amount: string }[]
  for (const k in debts) {
    const debt = debts[k]
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
      {
        row.map((debt, index) => {
          return (
            <Stack direction="row" gap={1} key={index}>
              {
                debt.amount.startsWith("-")
                  ? (
                    <Typography sx={{ color: "orange" }}>You owes {debt.name}
                      <FormattedAmount currency={debt.currency} value={debt.amount} />
                    </Typography>
                  )
                  : (
                    <Typography sx={{ color: "green" }}>{debt.name} owes You
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