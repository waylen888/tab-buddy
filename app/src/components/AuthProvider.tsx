import { createContext, useContext, useEffect } from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query"
import { Navigate } from "react-router-dom";

import { User } from "../model";
import { useAuthFetch } from "../hooks/api";
import { UserSettingLoader } from "./UserSettingProvider";
import { useAccessToken } from "../hooks/store";
import { RESET } from "jotai/utils";

const ctx = createContext<{
  user: User
}>({} as any)

const AuthProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const authFetch = useAuthFetch()
  const { data, error, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["auth", "refresh_token"],
    queryFn: () => {
      return authFetch<{
        token: string;
        user: User;
      }>(`/api/auth/refresh_token`)
    },
  })
  const [accessToken, setAccessToken] = useAccessToken()

  useEffect(() => {
    if (data?.token) {
      console.log(`refresh_token`, new Date(dataUpdatedAt).toLocaleString());
      setAccessToken(data.token)
    }
  }, [data?.token])

  if (isLoading) {
    return (
      <Backdrop open>
        <CircularProgress />
      </Backdrop>
    )
  } else if (error || !data?.token || !accessToken) {
    setAccessToken(RESET)
    return (
      <Navigate to="/login" />
    )
  }

  return (
    <ctx.Provider value={{ user: data.user }}>
      <UserSettingLoader />
      {children}
    </ctx.Provider>
  )
}

export default AuthProvider;

export const useAuth = () => useContext(ctx)

