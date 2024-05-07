import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { ExpenseWithSplitUsers } from "../model"
import { CircularProgress, Typography } from "@mui/material"

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
    <div>
      <h3>{data?.description}</h3>
      <h2>{data?.amount}</h2>
      <Typography>
        Added by {data?.createdBy?.displayName}
      </Typography>
      {JSON.stringify(data)}
    </div>
  )
}

export default Expense