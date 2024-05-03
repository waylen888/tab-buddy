
import { CssBaseline, CssVarsProvider } from '@mui/joy'
import NavBar from './components/NavBar'
import { Link, Outlet, Route, Routes } from 'react-router-dom'
import Groups from './routes/Groups'

function App() {
  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <NavBar />
      <Link to="/groups">Groups</Link>
      <main>
        <Outlet />
      </main>
    </CssVarsProvider>
  )
}

export default App
