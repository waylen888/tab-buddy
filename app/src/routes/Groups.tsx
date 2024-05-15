import { Group } from "../model"
import { Link, Outlet } from "react-router-dom"
import { authFetch } from "../hooks/api"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
export default function Groups() {
  // const data = useLoaderData<typeof loader>()
  const { data } = useQuery({
    queryKey: ["groups"],
    queryFn: () => authFetch<Group[]>("/api/groups"),
  })
  const { t } = useTranslation()
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
      <Link to="/groups/create">
        {t("groups.createGroup")}
      </Link>
      <Outlet />
    </div>
  )
}
