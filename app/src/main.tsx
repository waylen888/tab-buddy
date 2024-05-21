import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
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
import { CssBaseline } from '@mui/material';
import InviteDialog from './routes/InviteDialog';
import Expense from './routes/Expense';
import GroupSettingDialog from './routes/GroupSettingDialog';
import SetToken from './routes/SetToken';
import ExpenseEditDialog from './routes/ExpenseEditDialog';

import "./i18n";
import { ThemeProvider } from './components/ThemeProvider';

import AuthProvider from './components/AuthProvider';
import ExpenseIndex from './routes/ExpenseIndex';

const Settings = lazy(() => import("./routes/Settings"))

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} index />
      <Route path="/set-token" element={<SetToken />} index />
      <Route path="/" element={<AuthProvider><Layout /></AuthProvider>}>
        <Route path="friends" element={<div>My Friends</div>}>

        </Route>

        <Route path="groups" element={<Groups />} >
          <Route path="create" element={<GroupDialog />} />
        </Route>
        <Route path="group/:groupId">
          <Route element={<Group />} index />
          <Route path="create/expense" element={<ExpenseCreateDialog />} />
          <Route path="setting" element={<GroupSettingDialog />}>
            <Route path="invite" element={<InviteDialog />} />
          </Route>
          <Route path="expense/:expenseId" element={<Expense />}>
            <Route path="edit" element={<ExpenseEditDialog />} />
          </Route>
          <Route path="expense" element={<ExpenseIndex />} index />
        </Route>
        <Route path="settings" element={<Suspense fallback="loading"><Settings /></Suspense>} />
      </Route>
    </>
  )
)


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <Provider> */}
    {/* <UserSettingProvider> */}
    <ThemeProvider>
      <CssBaseline />
      {/* <GlobalStyles
        styles={{
          body: {
            backgroundColor: theme.palette.primary.main,
          }
        }}
      /> */}
      <QueryClientProvider>
        <SnackbarProvider
          dense
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          style={{
            marginTop: "env(safe-area-inset-top)",
          }}
        >
          <RouterProvider router={router} fallbackElement={null} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
    {/* </UserSettingProvider> */}
    {/* </Provider> */}
  </React.StrictMode>,
)
