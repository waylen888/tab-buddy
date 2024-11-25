import { Group } from "../model"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { NavRightToolBar } from "../components/NavBar"
import { Divider, IconButton, List, ListItem, ListItemButton, ListItemText } from "@mui/material"

import AddIcon from '@mui/icons-material/Add';
import { Fragment } from "react/jsx-runtime"

export default function Groups() {
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ["groups"],
    queryFn: () => authFetch<Group[]>("/api/groups"),
  })
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = (id: string) => () => {
    navigate(`/group/${id}`);
  }

  return (
    <div>
      <NavRightToolBar>
        <IconButton size="large" color="inherit" onClick={() => {
          navigate("/groups/create");
        }}>
          <AddIcon />
        </IconButton>
      </NavRightToolBar>
      <List>
        {data?.map(group => (
          <Fragment key={group.id}>
            <ListItem disablePadding>
              <ListItemButton onClick={handleClick(group.id)}>
                <ListItemText
                  primary={group.name}
                  primaryTypographyProps={{ variant: "h5" }}
                  secondary={new Date(group.createAt).toLocaleDateString()}
                />
              </ListItemButton>
            </ListItem>
            <Divider />
          </Fragment>
        ))}
      </List>

      <Outlet />
    </div>
  )
}
