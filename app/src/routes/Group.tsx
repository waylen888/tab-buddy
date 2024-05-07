
import { Group, User } from "../model"
import { Link, Outlet, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { authFetch } from "../hooks/api"
import { Stack } from "@mui/material";
import GroupExpenses from "./GroupExpenses";



export default function GroupRoute() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['group', id],
    queryFn: () => authFetch<Group>(`/api/group/${id}`)
  })

  return (
    <div>
      <h1>Group {data?.name}</h1>
      <p>{data?.createAt}</p>
      <p>{data?.updateAt}</p>

      {id ? <UserList groupId={id} /> : null}
      {id ? <GroupExpenses groupId={id} /> : null}
      <Outlet />
    </div>
  )
}


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