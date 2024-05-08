import { Stack, Typography } from "@mui/material"
import { useAuth } from "../components/AuthProvider"
import { Currency, GroupExpense, User } from "../model"

const GroupDebt: React.FC<{
  expenses: GroupExpense[] | undefined
}> = ({ expenses }) => {
  const { user: me } = useAuth()
  const debts = expenses?.reduce((pv, cv) => {
    if (!pv[cv.currency.code]) {
      pv[cv.currency.code] = {
        currency: cv.currency,
        debtor: {},
      }
    }
    pv[cv.currency.code] = cv.splitUsers.filter(user => user.id !== me.id).reduce((pv, cv) => {
      if (!pv.debtor[cv.username]) {
        pv.debtor[cv.username] = {
          user: cv,
          amount: 0,
        }
      }
      pv.debtor[cv.username].amount += Number(cv.amount)
      if (cv.paid) {
        pv.debtor[cv.username].user = cv
      }
      return pv
    }, pv[cv.currency.code])
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
        amount: (-debtor.amount).toFixed(debt.currency.decimalDigits),
      })
      // }
    }
  }
  return (
    <>
      {
        row.map((debt) => {
          return (
            <Stack direction="row" gap={1}>

              {
                debt.amount.startsWith("-")
                  ? (
                    <Typography sx={{ color: "orange" }}>You owes {debt.name} {debt.currency.symbol}{debt.amount}</Typography>

                  )
                  : (
                    <Typography sx={{ color: "green" }}>{debt.name} owes You {debt.currency.symbol}{debt.amount}</Typography>
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