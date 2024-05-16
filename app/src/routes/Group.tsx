
import { Group, GroupExpense } from "../model"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuthFetch } from "../hooks/api"
import { Box, IconButton, Stack, Typography } from "@mui/material";
import GroupExpenses from "./GroupExpenses";
import GroupDebt from "./GroupDebt";
import SettingsIcon from '@mui/icons-material/Settings';
import { SummaryButton } from "./GroupSummaryChart";
import { useSetAtom } from "jotai";
import { navAtom } from "../components/MobileNavBar";

export default function GroupRoute() {
  const { groupId } = useParams<{ groupId: string }>();
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => authFetch<Group>(`/api/group/${groupId}`)
  })

  const { refetch: refetchGroupExpenses, data: groupExpenses } = useQuery({
    queryKey: ['group', groupId, 'expenses'],
    queryFn: () => authFetch<GroupExpense[]>(`/api/group/${groupId}/expenses`)
  })
  const navigate = useNavigate()

  const setNav = useSetAtom(navAtom)

  setNav((prevNav) => ({
    ...prevNav,
    handleBackButton: () => {
      navigate(-1);
    }
  }))

  return (
    <div>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="baseline" gap={1} display="flex" justifyContent="space-between">
          <Typography variant="h4">{data?.name}</Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            <SummaryButton groupId={groupId} />
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

