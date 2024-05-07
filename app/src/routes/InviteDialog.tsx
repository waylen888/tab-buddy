import { LoadingButton } from "@mui/lab"
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { authFetch } from "../hooks/api"
import { useNavigate, useParams } from "react-router-dom"
import { useSnackbar } from "notistack"
import CloseIcon from '@mui/icons-material/Close';

interface InviteFormValues {
  username: string
}

const InviteDialog = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: InviteFormValues) => {
      return authFetch(`/api/group/${id}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['group', id, 'members']
      })
    },
  })
  const navigate = useNavigate()
  const methods = useForm<InviteFormValues>()
  const { enqueueSnackbar } = useSnackbar()
  const onSubmit = async (values: InviteFormValues) => {
    console.debug(`submit`, values)
    try {
      await mutateAsync(values)
      navigate(-1)
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: "error" })
    }
  }

  const handleClose = () => {
    navigate(-1)
  }

  return (
    <Dialog open>
      <DialogTitle>Invite Friend</DialogTitle>
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

      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Controller
            name="username"
            control={methods.control}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                placeholder="UserName"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <LoadingButton
            loading={isPending}
            disabled={isPending || !methods.formState.isValid}
            type="submit"
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default InviteDialog