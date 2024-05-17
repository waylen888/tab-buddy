import { CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Switch, TextField, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Outlet, useNavigate, useParams } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { Group, User } from "../model"
import CloseIcon from '@mui/icons-material/Close';
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form"
import { useEffect } from "react"
import { useSnackbar } from "notistack"

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

      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
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

          {groupId ? <UserList groupId={groupId} /> : null}
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
  return (
    <Stack>
      <h2>Users</h2>
      <Link to={`invite`}>
        Invite Friend
      </Link>
      {
        data?.map((user, index) => (
          <div key={user.id}>{index + 1} - {user.displayName}</div>
        ))
      }
    </Stack>
  )
}