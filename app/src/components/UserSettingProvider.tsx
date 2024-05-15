import { useQuery } from "@tanstack/react-query"
import { UserSetting } from "../model"
import { authFetch } from "../hooks/api"
import { CircularProgress } from "@mui/material"
import { createContext, useContext } from "react"

const ctx = createContext<UserSetting>({} as any)

export const UserSettingProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["me", "setting"],
    queryFn: () => authFetch<UserSetting>(`/api/me/setting`)
  })

  if (isLoading) {
    return (
      <CircularProgress />
    )
  }

  return (
    <ctx.Provider value={data}>
      {children}
    </ctx.Provider>
  )
}

export const useUserSetting = () => useContext(ctx)