import { useLoaderData } from "react-router-typesafe"
import { Group } from "../model"
import { Link } from "react-router-dom"
export default function Groups() {
  const data = useLoaderData<typeof loader>()

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
    </div>
  )
}

export const loader = async () => fetch("/api/groups").then(res => res.json() as Promise<Group[]>)