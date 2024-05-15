import { AppBar, Box, Button, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeSwitch from './ThemeSwitch';

export const DRAWER_WIDTH = "200px"

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  const navigate = useNavigate();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.up('md'));
  const { t } = useTranslation()

  const DrawerList = (
    <Box sx={{ width: DRAWER_WIDTH }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {[
          { path: "groups", label: t('menus.groups') },
        ].map((menu) => (
          <ListItem key={menu.path} disablePadding>
            <ListItemButton onClick={() => {
              navigate(menu.path)
            }}>
              <ListItemText primary={menu.label} />
            </ListItemButton>
          </ListItem>
        ))}

        <ListItem key="theme_switch" disablePadding>
          <ThemeSwitch />
        </ListItem>

        <ListItem key="logout" disablePadding>
          <ListItemButton onClick={() => {
            localStorage.removeItem("access_token")
            navigate("/login")
          }}>
            <ListItemText primary={t("logout")} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <Drawer
        open={open || fullScreen}
        onClose={toggleDrawer(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
          disablePortal: true,
          disableAutoFocus: true,
          disableScrollLock: true,
        }}
        variant={fullScreen ? "permanent" : "temporary"}
      >
        <Toolbar />{/* for padding */}
        {DrawerList}
      </Drawer>

      <AppBar
        position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {
            fullScreen
              ? null
              : (
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ mr: 2 }}
                  onClick={toggleDrawer(true)}
                >
                  <MenuIcon />
                </IconButton>
              )
          }

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TAB BUDDY
          </Typography>

        </Toolbar>
      </AppBar>
    </>
  );
}



