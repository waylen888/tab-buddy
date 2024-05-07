import { Group } from "../model"
import { Link, Outlet } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { useQuery } from "@tanstack/react-query"
export default function Groups() {
  // const data = useLoaderData<typeof loader>()
  const {data} = useQuery({
    queryKey: ["groups"],
    queryFn: () => authFetch<Group[]>("/api/groups"),
  })
  return (
    <div>

      <ul>
        {data?.map(group => (
          <li key={group.id}>
            <Link to={`/group/${group.id}`}>
              {group.name}
            </Link>

          </li>
        ))}
      </ul>
      <Link to="/groups/create">Create Group</Link>
      <Outlet />
    </div>
  )
}
