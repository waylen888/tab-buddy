import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { ExpenseWithSplitUsers } from "../model"
import { CircularProgress, Divider, Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import Comments from "./Comments"

const Expense = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => {
      return authFetch<ExpenseWithSplitUsers>(`/api/expense/${id}`)
    }
  })

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <Stack gap={2}>
      <Stack sx={{ p: 1 }}>
        <Typography variant="h4">{data?.description}</Typography>
        <Typography>{data?.amount}</Typography>
        <Typography variant="caption">
          Added by {data?.createdBy?.displayName} on {dayjs(data?.createAt).format("YYYY/MM/DD")}
        </Typography>
      </Stack>
      <Divider />
      <Comments />
    </Stack >
  )
}

export default Expense