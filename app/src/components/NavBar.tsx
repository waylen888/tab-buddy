import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Portal, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeSwitch from './ThemeSwitch';
import { useAccessToken } from '../hooks/store';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import React, { useEffect } from 'react';


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


export const NavBackButton = () => {
  const navigate = useNavigate();
  return (
    <IconButton
      size="large"
      edge="start"
      color="inherit"
      aria-label="back"
      sx={{ mr: 2 }}
      onClick={() => {
        navigate("..")
      }}
    >
      <ArrowBackIosNewIcon />
    </IconButton>
  )
}

// export const useMenuButton = () => {
//   const setBackFunc = useSetAtom(backFuncAtom)

//   useEffect(() => {
//     setBackFunc(prev => ({}))
//   }, [])
// }

const leftContainerAtom = atom<HTMLDivElement | null>(null)
const rightContainerAtom = atom<HTMLDivElement | null>(null)

const ResponsiveAppBar = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.up('md'));
  const [_, setOpen] = useAtom(drawerAtom)
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  const setLeftContainer = useSetAtom(leftContainerAtom)
  const setRightContainer = useSetAtom(rightContainerAtom)

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <Toolbar>
        <Box
          component="div"
          sx={{
            color: "inherit"
          }}
          ref={(ref: HTMLDivElement) => { setLeftContainer(ref) }}
        />
        <Typography variant="h6" component="div" sx={{
          // flexGrow: 1 
          position: "absolute",
          left: 0, right: 0, marginLeft: "auto", marginRight: "auto", width: "120px"
        }}>
          TAB BUDDY
        </Typography>
        <Box sx={{ flexGrow: 1 }}></Box>
        <Box
          component="div"
          sx={{
            color: "inherit"
          }}
          ref={(ref: HTMLDivElement) => { setRightContainer(ref) }}
        />
      </Toolbar>
    </AppBar >
  )
}

export const NavLeftToolBar: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  const container = useAtomValue(leftContainerAtom)
  if (!container) return null
  return (
    <Portal container={container} >
      {children}
    </Portal>
  )
}

export const NavRightToolBar: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {
  const container = useAtomValue(rightContainerAtom)
  if (!container) return null
  return (
    <Portal container={container} >
      {children}
    </Portal>
  )
}