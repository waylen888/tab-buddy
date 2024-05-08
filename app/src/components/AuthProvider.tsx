import { useQuery } from "@tanstack/react-query"
import { createContext, useContext, useEffect } from "react";
import { User } from "../model";
import { Navigate } from "react-router-dom";
import { authFetch } from "../hooks/api";
import { CircularProgress } from "@mui/material";

const ctx = createContext<{
  user: User
}>({} as any)

const AuthProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { data, error, isLoading } = useQuery<{
    token: string
    user: User
  }>({
    queryKey: ['auth', 'refresh_token'],
    queryFn: () => {
      return authFetch(`/api/auth/refresh_token`)
    }
  });

  useEffect(() => {
    if (data?.token) {
      localStorage.setItem('access_token', data.token)
    }
  }, [data?.token])

  if (isLoading) {
    return (
      <CircularProgress />
    )
  }

  if (error || !data?.user) {
    localStorage.removeItem("access_token")
    return (
      <Navigate to="/login" />
    )
  }

  return (
    <ctx.Provider value={{ user: data.user }}>
      {children}
    </ctx.Provider>
  )
}

export default AuthProvider;

export const useAuth = () => useContext(ctx)

