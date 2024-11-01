import { LoadingButton } from "@mui/lab"
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { useAuthFetch } from "../hooks/api"
import { useNavigate, useParams } from "react-router-dom"
import { useSnackbar } from "notistack"
import CloseIcon from '@mui/icons-material/Close';
import DialogCloseButton from "../components/DialogCloseButton"
import { useTranslation } from "react-i18next"

interface InviteFormValues {
  username?: string
  email?: string
}

const InviteDialog = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: InviteFormValues) => {
      return authFetch(`/api/group/${groupId}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['group', groupId, 'members']
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
      enqueueSnackbar(t('group.invite_member_dialog.success_message'), { variant: "success" })
      navigate("..")
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: "error" })
    }
  }

  const handleClose = () => {
    navigate("..")
  }

  return (
    <Dialog open>
      <DialogTitle>{t('group.invite_member_dialog.title')}</DialogTitle>

      <DialogCloseButton onClick={handleClose} />

      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Controller
            name="email"
            control={methods.control}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                placeholder={t('group.invite_member_dialog.content')}
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
            {t('group.invite_member_dialog.submit_button')}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default InviteDialog