import React from 'react'
import ReactDOM from 'react-dom/client'
import { Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';
import Layout from './routes/Layout';
import Groups from './routes/Groups';
import Group from './routes/Group';
import Login from './routes/Login';

import './index.css'
import '@fontsource/inter';
import ExpenseCreateDialog from './routes/ExpenseCreateDialog';
import QueryClientProvider from './components/QueryClientProvider';

import { SnackbarProvider } from 'notistack';
import GroupDialog from './routes/GroupDialog';
import { CssBaseline, GlobalStyles, ThemeProvider, createTheme } from '@mui/material';
import InviteDialog from './routes/InviteDialog';
import Expense from './routes/Expense';
import GroupSettingDialog from './routes/GroupSettingDialog';
import SetToken from './routes/SetToken';
import ExpenseEditDialog from './routes/ExpenseEditDialog';


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/set-token",
    element: <SetToken />
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
        path: "group/:groupId",
        children: [
          {
            path: "",
            element: <Group />,
            children: [
              {
                path: "create/expense",
                element: <ExpenseCreateDialog />
              },
              {
                path: "setting",
                element: <GroupSettingDialog />,
                children: [
                  {
                    path: "invite",
                    element: <InviteDialog />
                  },
                ],
              },
            ],
          },
          {
            path: "expense/:expenseId",
            element: <Expense />,
            children: [
              {
                path: "edit",
                element: <ExpenseEditDialog />
              },
            ],
          },
        ],
      },
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
      <CssBaseline />
      {/* <GlobalStyles
        styles={{
          body: {
            backgroundColor: theme.palette.primary.main,
          }
        }}
      /> */}
      <QueryClientProvider>
        <SnackbarProvider dense anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <RouterProvider router={router} fallbackElement={null} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
