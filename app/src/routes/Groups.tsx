import { Group } from "../model"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { NavRightToolBar } from "../components/NavBar"
import { IconButton } from "@mui/material"

import AddIcon from '@mui/icons-material/Add';

export default function Groups() {
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ["groups"],
    queryFn: () => authFetch<Group[]>("/api/groups"),
  })
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <div>
      <NavRightToolBar>
        <IconButton size="large" color="inherit" onClick={() => {
          navigate("/groups/create");
        }}>
          <AddIcon />
        </IconButton>
      </NavRightToolBar>
      <ul>
        {data?.map(group => (
          <li key={group.id}>
            <Link to={`/group/${group.id}`}>
              {group.name}
            </Link>
          </li>
        ))}
      </ul>

      <Outlet />
    </div>
  )
}
