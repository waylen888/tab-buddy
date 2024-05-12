
import { Box, CssBaseline, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import NavBar, { DRAWER_WIDTH } from '../components/NavBar'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AuthProvider from '../components/AuthProvider'

function Layout() {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();
  if (pathname === "/") {
    return <Navigate to="groups" />
  }
  return (
    <AuthProvider>
      <CssBaseline />
      <NavBar />
      <Box component="main" sx={{ flexGrow: 1, paddingLeft: fullScreen ? DRAWER_WIDTH : 0 }}>
        <Toolbar />{/* for padding */}
        <Outlet />
      </Box>
    </AuthProvider>
  )
}

export default Layout
