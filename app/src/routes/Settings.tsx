import { List, ListItem, ListItemButton, ListItemText, Stack } from "@mui/material";
import ThemeSwitch from "../components/ThemeSwitch";
import { useAccessToken } from "../hooks/store";
import { useTranslation } from "react-i18next";
import { RESET } from "jotai/utils";

export default function Settings() {
  const [, setAccessToken] = useAccessToken()
  const { t } = useTranslation();
  return (
    <Stack gap={2}>
      <h1>Settings</h1>
      <List>
        <ListItem key="theme_switch" disablePadding>
          <ThemeSwitch />
        </ListItem>

        <ListItem key="logout" disablePadding>
          <ListItemButton onClick={() => {
            setAccessToken(RESET)
          }}>
            <ListItemText primary={t("logout")} />
          </ListItemButton>
        </ListItem>
      </List>
    </Stack>
  )
}