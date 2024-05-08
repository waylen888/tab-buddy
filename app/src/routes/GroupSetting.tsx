import { Stack } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useParams } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { User } from "../model"

const GroupSetting: React.FC<{}> = () => {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      group setting
      {id ? <UserList groupId={id} /> : null}
      <Outlet />
    </div>
  )
}

export default GroupSetting


const UserList: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { data } = useQuery({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => authFetch<User[]>(`/api/group/${groupId}/members`)
  })
  return (
    <Stack>
      <h2>Users</h2>
      <Link to={`invite`}>
        Invite Friend
      </Link>
      {
        data?.map((user, index) => (
          <div key={user.id}>{index + 1} - {user.displayName}</div>
        ))
      }
    </Stack>
  )
}