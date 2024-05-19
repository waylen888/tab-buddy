import { useQuery } from "@tanstack/react-query"
import { UserSetting } from "../model"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useAuthFetch } from "../hooks/api"
import { useEffect } from "react"

const userSettingAtom = atom<UserSetting>({
  themeMode: "light",
  pushNotification: false,
})


export const useUserSetting = () => useAtomValue(userSettingAtom)

export const UserSettingLoader = () => {
  const authFetch = useAuthFetch()
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ['me', 'setting'],
    queryFn: () => {
      return authFetch<UserSetting>(`/api/me/setting`)
    }
  })

  const setUserSetting = useSetAtom(userSettingAtom)

  useEffect(() => {
    if (data) {
      console.debug(`load user setting last update at:`, new Date(dataUpdatedAt).toLocaleString())
      setUserSetting(data)
    }
  }, [data])

  return <></>
}