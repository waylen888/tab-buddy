import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import Groups, { loader as groupsLoader } from './routes/Groups';
import Group, { loader as groupLoader } from './routes/Group';

import './index.css'
import '@fontsource/inter';
import ExpenseDialog from './routes/ExpenseDialog';
import QueryClientProvider from './components/QueryClientProvider';
import { SnackbarProvider } from 'notistack';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/groups",
        element: <Groups />,
        loader: groupsLoader
      },
      {
        path: "/group/:id",
        element: <Group />,
        loader: groupLoader,
        children: [
          {
            path: "/group/:id/create/expense",
            element: <ExpenseDialog />
          }
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider>
      <SnackbarProvider>
      <RouterProvider router={router} />
      </SnackbarProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
