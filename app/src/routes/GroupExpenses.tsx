import { Fragment, ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { authFetch } from "../hooks/api"
import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { Link } from "react-router-dom"
import { Expense, ExpenseWithSplitUsers } from "../model"
import dayjs from "dayjs"

const GroupExpenses: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { data } = useQuery({
    queryKey: ['group', groupId, 'expenses'],
    queryFn: () => authFetch<ExpenseWithSplitUsers[]>(`/api/group/${groupId}/expenses`)
  })

  const catdata = data?.reduce((pv, expense, index, data) => {
    const date = dayjs(expense.date).format("YYYY/MM/DD");
    const prevDate = dayjs(data[index - 1]?.date).format("YYYYMMDD");
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
    values: ExpenseWithSplitUsers[]
  }[])

  return (
    <Stack>
      <h2>Expenses</h2>
      <Link to={`create/expense`}>
        Create Expense
      </Link>
      <TableContainer>
        <Table stickyHeader size="small">
          {
            catdata?.map((cat, index) => {

              let nodes: ReactNode[] = []

              nodes.push(
                <TableHead key={`head-${cat.date}-${index}`}>
                  <TableRow>
                    <TableCell>
                      {cat.date}
                    </TableCell>
                    <TableCell>

                    </TableCell>
                  </TableRow>
                </TableHead>)

              nodes.push(
                <TableBody key={`body-${cat.date}-${index}`}>
                  {cat.values.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Stack>
                          <Link to={`/expense/${expense.id}`}>
                            {expense.description}
                          </Link>
                          {expense.splitUsers.find(user => user.paid)?.displayName} paid {expense.amount}
                        </Stack>

                      </TableCell>
                      <TableCell>
                        {expense.amount}
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
    </Stack>
  )
}

export default GroupExpenses