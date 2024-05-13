
import { Group, GroupExpense, User } from "../model"
import { Link, Outlet, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { authFetch } from "../hooks/api"
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import GroupExpenses from "./GroupExpenses";
import GroupDebt from "./GroupDebt";
import SettingsIcon from '@mui/icons-material/Settings';
import { SummaryButton } from "./SummaryChart";

export default function GroupRoute() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => authFetch<Group>(`/api/group/${groupId}`)
  })

  const { refetch: refetchGroupExpenses, data: groupExpenses } = useQuery({
    queryKey: ['group', groupId, 'expenses'],
    queryFn: () => authFetch<GroupExpense[]>(`/api/group/${groupId}/expenses`)
  })
  const navigate = useNavigate()

  return (
    <div>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="baseline" gap={1} display="flex" justifyContent="space-between">
          <Typography variant="h4">{data?.name}</Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            <SummaryButton expenses={groupExpenses} />
            <IconButton onClick={() => navigate("setting")}>
              <SettingsIcon />
            </IconButton>
          </Stack>
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

