
import { Group, GroupExpense, User } from "../model"
import { Link, Outlet, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { authFetch } from "../hooks/api"
import { Box, IconButton, Stack, Typography } from "@mui/material";
import GroupExpenses from "./GroupExpenses";
import GroupDebt from "./GroupDebt";
import SettingsIcon from '@mui/icons-material/Settings';


export default function GroupRoute() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['group', id],
    queryFn: () => authFetch<Group>(`/api/group/${id}`)
  })

  const { refetch: refetchGroupExpenses, data: groupExpenses } = useQuery({
    queryKey: ['group', id, 'expenses'],
    queryFn: () => authFetch<GroupExpense[]>(`/api/group/${id}/expenses`)
  })
  const navigate = useNavigate()

  return (
    <div>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="baseline" gap={1} display="flex" justifyContent="space-between">
          <Typography variant="h4">{data?.name}</Typography>
          <IconButton onClick={() => navigate("setting")}>
            <SettingsIcon />
          </IconButton>
        </Stack>
        <GroupDebt expenses={groupExpenses} />
      </Box>
      <GroupExpenses
        data={groupExpenses}
        onRefetchRequest={() => refetchGroupExpenses()}
      />

      <Outlet />
    </div>
  )
}


