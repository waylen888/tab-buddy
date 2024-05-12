import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useNavigate, useParams } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { ExpenseWithSplitUsers } from "../model"
import { CircularProgress, Divider, IconButton, Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import Comments from "./Comments"
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import FormattedAmount from "../components/FormattedAmount"

const Expense = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => {
      return authFetch<ExpenseWithSplitUsers>(`/api/expense/${expenseId}`)
    }
  })

  const navigate = useNavigate();

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <Stack gap={2}>
      <Stack sx={{ p: 1 }}>
        <Stack direction="row" gap={2}>
          <Typography variant="h4">{data?.description}</Typography>
          <IconButton onClick={() => navigate("edit")}>
            <ModeEditIcon />
          </IconButton>
        </Stack>

        <Typography>
          <FormattedAmount currency={data.currency} value={data.amount} />
        </Typography>
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