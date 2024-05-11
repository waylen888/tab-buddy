import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useParams } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { ExpenseWithSplitUsers } from "../model"
import { CircularProgress, Divider, Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import Comments from "./Comments"

const Expense = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => {
      return authFetch<ExpenseWithSplitUsers>(`/api/expense/${expenseId}`)
    }
  })

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <Stack gap={2}>
      <Stack sx={{ p: 1 }}>
        <Typography variant="h4">{data?.description}</Typography>
        <Link to="edit">Edit</Link>
        <Typography>{data?.amount}</Typography>
        <Typography variant="caption">
          Added by {data?.createdBy?.displayName} on {dayjs(data?.createAt).format("YYYY/MM/DD")}
        </Typography>
      </Stack>
      <Divider />
      <Comments />
      <Outlet />
    </Stack >
  )
}

export default Expense