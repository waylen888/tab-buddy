import { CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Switch, TextField, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Outlet, useNavigate, useParams } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { Group, User } from "../model"
import CloseIcon from '@mui/icons-material/Close';
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form"
import { useEffect } from "react"
import { useSnackbar } from "notistack"
import DialogCloseButton from "../components/DialogCloseButton"
import { AlertDialogProvider, useAlertDialog } from "../components/AlertDialog"
import { useTranslation } from "react-i18next"

interface GroupModifyFormValues {
  name: string;
  convertToTwd: boolean;
}

const GroupSettingDialog: React.FC<{}> = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const handleClose = () => {
    navigate("..")
  }
  const authFetch = useAuthFetch()
  const { data, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => authFetch<Group>(`/api/group/${groupId}`)
  })
  const methods = useForm<GroupModifyFormValues>()


  useEffect(() => {
    if (data) {
      methods.reset(data)
    }
  }, [data, methods.reset])

  return (
    <Dialog open fullScreen={fullScreen}>
      <DialogTitle>
        Group Setting
      </DialogTitle>

      <DialogCloseButton onClick={handleClose} />

      {
        isLoading
          ? (
            <DialogContent>
              <CircularProgress />
            </DialogContent>
          )
          : (
            <FormProvider {...methods}>
              <Form />
            </FormProvider>
          )
      }
    </Dialog>
  )
}

export default GroupSettingDialog


const Form = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { handleSubmit, control, trigger } = useFormContext<GroupModifyFormValues>()
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const authFetch = useAuthFetch()
  const { mutateAsync } = useMutation({
    mutationFn: async (values: GroupModifyFormValues) => {
      return await authFetch(`/api/group/${groupId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...values,
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })

  const onSubmit = async (values: GroupModifyFormValues) => {
    try {
      await mutateAsync(values)
      // enqueueSnackbar("Saving...", { variant: "info" })
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: "contents" }}
    >
      <DialogContent dividers>
        <Stack gap={2}>
          <Stack
            display="flex"
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
          >
            <Typography>名稱</Typography>
            <Controller
              control={control}
              name="name"
              defaultValue=""
              rules={{ required: true }}
              render={({ field }) => <TextField
                {...field}
                onBlur={() => {
                  trigger("name").then((isValid) => {
                    if (isValid) {
                      handleSubmit(onSubmit)()
                    }
                  });
                }}
              />}
            />
          </Stack>
          <Stack
            display="flex"
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
          >
            <Typography>轉換台幣匯率</Typography>
            <Controller
              control={control}
              name="convertToTwd"
              defaultValue={false}
              render={({ field }) => <Switch {...field} checked={field.value}
                onChange={(_, checked) => {
                  field.onChange(checked)
                  trigger("convertToTwd").then((isValid) => {
                    if (isValid) {
                      handleSubmit(onSubmit)()
                    }
                  });
                }}
              />}
            />
          </Stack>

          <Divider></Divider>

          {
            groupId
              ? (
                <AlertDialogProvider>
                  <UserList groupId={groupId} />
                </AlertDialogProvider>
              )
              : null
          }
        </Stack>

        <Outlet />
      </DialogContent>
    </form>

  )
}

const UserList: React.FC<{ groupId: string }> = ({ groupId }) => {
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => authFetch<User[]>(`/api/group/${groupId}/members`)
  })
  const { t } = useTranslation()
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (memberId: string) => authFetch(`/api/group/${groupId}/member/${memberId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      enqueueSnackbar(t("group.remove_member_dialog.success_message"), { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'members'] })
    },
    onError: (err) => {
      enqueueSnackbar(err.message, { variant: "error" })
    }
  });

  const openDeleteAlert = useAlertDialog()
  const { enqueueSnackbar } = useSnackbar()
  const handleDelete = (memberId: string, name: string) => () => {
    openDeleteAlert({
      title: t("group.remove_member_dialog.title"),
      content: t("group.remove_member_dialog.content", { name }),
      confirmText: t("group.remove_member_dialog.confirm"),
      cancelText: t("group.remove_member_dialog.cancel"),
      onConfirm: async () => mutate(memberId),
    })
  }

  return (
    <Stack>
      <h2>Users</h2>
      <Link to={`invite`}>
        Invite Friend
      </Link>
      {
        data?.map((user, index) => (
          <Stack key={user.id}>
            <div>{index + 1} - {user.displayName}</div>
            <button onClick={handleDelete(user.id, user.displayName)}>delete</button>
          </Stack>
        ))
      }
    </Stack>
  )
}