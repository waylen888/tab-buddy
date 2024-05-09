
import { Box, CssBaseline, Toolbar } from '@mui/material'
import NavBar from '../components/NavBar'
import { Outlet } from 'react-router-dom'
import AuthProvider from '../components/AuthProvider'

function Layout() {
  return (
    <AuthProvider>
      <CssBaseline />
      <NavBar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar />{/* for padding */}
        <Outlet />
      </Box>
    </AuthProvider>
  )
}

export default Layout
