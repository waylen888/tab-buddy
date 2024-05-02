
import { CssBaseline, CssVarsProvider } from '@mui/joy'
import NavBar from './components/NavBar'

function App() {

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline/>
      <NavBar />
    </CssVarsProvider>
  )
}

export default App
