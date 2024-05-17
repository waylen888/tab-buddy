import { Fragment, ReactNode } from "react"
import { Box, Fab, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, tableCellClasses } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { Currency, GroupExpense, User } from "../model"
import dayjs from "dayjs"
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from "../components/AuthProvider"
import FormattedAmount from "../components/FormattedAmount"
import CategoryIcon from "../components/CategoryIcon"
import { useTranslation } from "react-i18next"
import { NavRightToolBar } from "../components/NavBar"

const GroupExpenses: React.FC<{
  data: GroupExpense[] | undefined;
  onRefetchRequest?: () => void
}> = ({ data, onRefetchRequest = () => { } }) => {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const navigate = useNavigate();
  const catdata = data?.reduce((pv, expense, index, data) => {
    const date = dayjs(expense.date).format("YYYY/MM/DD");
    const prevDate = dayjs(data[index - 1]?.date).format("YYYY/MM/DD");

    if (date !== prevDate || pv.length === 0) {
      pv.push({
        date: date,
        values: [expense]
      })
    } else {
      pv[pv.length - 1].values.push(expense)
    }
    return pv
  }, [] as {
    date: string,
    values: GroupExpense[]
  }[])

  const handleAdd = () => {
    navigate(`create/expense`)
  }

  return (
    <Stack gap={1}>

      <NavRightToolBar>
        <IconButton size="large" color="inherit" onClick={handleAdd}>
          <AddIcon />
        </IconButton>
      </NavRightToolBar>

      <TableContainer>
        <Table stickyHeader size="small">
          {
            catdata?.map((cat, index) => {

              let nodes: ReactNode[] = []

              nodes.push(
                <TableHead key={`head-${cat.date}-${index}`}>
                  <TableRow sx={{
                    [`.${tableCellClasses.root}`]: {
                      backgroundColor: (theme) => theme.palette.primary.main,
                      color: (theme) => theme.palette.getContrastText(theme.palette.primary.main),
                      fontWeight: "bold",
                    }
                  }}>
                    <TableCell colSpan={3}>
                      {cat.date}
                    </TableCell>
                  </TableRow>
                </TableHead>)

              nodes.push(
                <TableBody key={`body-${cat.date}-${index}`}>
                  {cat.values.map((expense) => (
                    <TableRow
                      key={expense.id}
                      sx={{ cursor: "pointer" }}
                      onClick={() => {
                        navigate(`expense/${expense.id}`)
                      }}
                      hover
                    >
                      <TableCell sx={{ width: 0 }} padding="checkbox">
                        <CategoryIcon category={expense.category} />
                      </TableCell>
                      <TableCell>
                        <Stack>
                          <Typography fontWeight="bold">
                            {expense.description}
                          </Typography>
                          <Typography variant="caption">
                            <YouOrDisplayName user={expense.splitUsers.find(user => user.paid)} />
                            <span> {t("group.expenses.paid")} </span>
                            <FormattedAmount currency={expense.currency} value={expense.amount} />
                          </Typography>
                        </Stack>

                      </TableCell>
                      <TableCell>
                        <Amount
                          currency={expense.currency}
                          value={expense.splitUsers.find((user) => user.id === me.id)?.amount ?? null}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )
              return (
                <Fragment key={cat.date + index}>
                  {nodes}
                </Fragment>
              )
            })
          }
        </Table>
      </TableContainer>
    </Stack >
  )
}

export default GroupExpenses

const YouOrDisplayName: React.FC<{
  user: User | undefined
}> = ({ user }) => {
  const { user: me } = useAuth()
  const { t } = useTranslation()
  return (
    <span>
      {
        user?.id === me.id ? t("group.expenses.you") : user?.displayName
      }
    </span>
  )
}

const Amount: React.FC<{
  currency: Currency;
  value: string | null;
}> = ({ currency, value }) => {
  const { t } = useTranslation()
  if (!value) {
    return (
      <Stack sx={{}}>
        <Typography variant="caption" sx={{ textAlign: 'right' }}>
          {t("group.expenses.not_involved")}
        </Typography>
      </Stack>
    )
  }

  const borrowed = value.startsWith("-")
  return (
    <Stack sx={{ color: borrowed ? "orange" : "green" }}>
      <Typography variant="caption" sx={{ textAlign: 'right' }}>
        {borrowed ? t("group.expenses.you_borrowd") : t("group.expenses.you_lent")}
      </Typography>
      <Typography variant="caption" sx={{ textAlign: 'right' }} fontWeight="bold">
        <FormattedAmount currency={currency} value={value} />
      </Typography>
    </Stack>
  )
}
