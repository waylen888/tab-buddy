
import { CssBaseline } from '@mui/material'
import NavBar from '../components/NavBar'
import { Outlet } from 'react-router-dom'
import AuthProvider from '../components/AuthProvider'

function Layout() {
  return (
    <AuthProvider>
      <CssBaseline />
      <NavBar />
      <main>
        <Outlet />
      </main>
    </AuthProvider>
  )
}

export default Layout
