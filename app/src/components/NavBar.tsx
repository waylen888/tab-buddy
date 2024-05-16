import { AppBar, Box, Button, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeSwitch from './ThemeSwitch';
import { accessTokenAtom, useAccessToken } from '../hooks/store';
import { atom, useAtom, useAtomValue } from 'jotai';
import { RESET } from 'jotai/utils';
import { navAtom } from './MobileNavBar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

export const DRAWER_WIDTH = "200px"

const drawerAtom = atom(false)

export default function NavBar() {
  const [open, setOpen] = useAtom(drawerAtom)
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  const navigate = useNavigate();
  const [, setAccessToken] = useAccessToken()
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
            setAccessToken(RESET)
            // navigate("/login")
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
      <ResponsiveAppBar />
    </>
  );
}


const ResponsiveAppBar = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.up('md'));
  const [_, setOpen] = useAtom(drawerAtom)
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  const nav = useAtomValue(navAtom)
  return (
    <AppBar
      position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        {
          fullScreen
            ? null
            : nav.handleBackButton
              ? (
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ mr: 2 }}
                  onClick={nav.handleBackButton}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
              )
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
  )
}
