import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './routes/Layout';
import Groups from './routes/Groups';
import Group from './routes/Group';
import Login from './routes/Login';

import './index.css'
import '@fontsource/inter';
import ExpenseDialog from './routes/ExpenseDialog';
import QueryClientProvider from './components/QueryClientProvider';

import { SnackbarProvider } from 'notistack';
import GroupDialog from './routes/GroupDialog';
import { ThemeProvider, createTheme } from '@mui/material';
import InviteDialog from './routes/InviteDialog';
import Expense from './routes/Expense';
import GroupSetting from './routes/GroupSetting';


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "groups",
        element: <Groups />,
        children: [
          {
            path: "create",
            element: <GroupDialog />,
            errorElement: <div>Error</div>
          },
        ],
      },
      {
        path: "group/:id",
        element: <Group />,
        children: [
          {
            path: "create/expense",
            element: <ExpenseDialog />
          },
        ],
      },
      {
        path: "group/:id/setting",
        element: <GroupSetting />,
        children: [
          {
            path: "invite",
            element: <InviteDialog />
          },
        ],
      },
      {
        path: "/expense/:id",
        element: <Expense />
      },
      {
        path: "*",
        element: <div>404</div>
      }
    ],
  },
])

const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
      }
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      }
    },
    MuiDialog: {
      defaultProps: {
        fullWidth: true,
      }
    },
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider>
        <SnackbarProvider dense anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
