import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import NavBar, { DRAWER_WIDTH } from '../components/NavBar'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import BottomNavBar from '../components/BottomNavBar';

function Layout() {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();

  if (pathname === "/") {
    return <Navigate to="groups" />
  }

  const showBottomNavigation = !fullScreen
  return (
    <>
      <NavBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          paddingLeft: fullScreen ? DRAWER_WIDTH : 0,
          pb: showBottomNavigation ? 7 : 0,
        }}
      >
        <Toolbar />{/* for padding */}
        <Outlet />
      </Box>

      {
        showBottomNavigation
          ? <BottomNavBar />
          : null
      }
    </>
  )
}

export default Layout
