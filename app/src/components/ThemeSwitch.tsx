import { Switch } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "../hooks/api";
import { UserSetting } from "../model";
import { useSnackbar } from "notistack";
import { useUserSetting } from "./UserSettingProvider";
import MaterialUISwitch from "./MaterialUISwitch";

export default function ThemeSwitch() {
  const { enqueueSnackbar } = useSnackbar()
  const setting = useUserSetting()
  const queryClient = useQueryClient()
  const authFetch = useAuthFetch()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: Partial<UserSetting>) => authFetch(`/api/me/setting`, {
      method: "PATCH",
      body: JSON.stringify({ ...values })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "setting"] })
    }
  })

  return (
    <MaterialUISwitch
      disabled={isPending}
      checked={setting.themeMode === "dark"}
      onChange={async (_, checked) => {
        try {
          await mutateAsync({ themeMode: checked ? 'dark' : 'light' })
        } catch (err) {
          enqueueSnackbar((err as Error).message, { variant: "error" })
        }
      }}
    />
  )
}