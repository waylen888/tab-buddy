import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuthFetch } from "../hooks/api";
import { LoadingButton } from "@mui/lab";
import CloseIcon from '@mui/icons-material/Close';

interface GroupCreateForm {
  name: string;
}

export default function GroupDialog() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const methods = useForm<GroupCreateForm>({})
  const authFetch = useAuthFetch()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: GroupCreateForm) => {
      return authFetch(`/api/group`, {
        method: 'POST',
        body: JSON.stringify(values)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['groups']
      })
    }
  })
  const handleSubmit = async (values: GroupCreateForm) => {
    try {
      console.debug(`submit`, values)
      await mutateAsync(values)
      navigate("..")
      enqueueSnackbar(`group created`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    } finally {
    }
  }
  const handleClose = () => {
    navigate("..")
  }
  return (
    <Dialog open>
      <DialogTitle>
        Group
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

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          <DialogContent dividers>
            <Stack gap={2}>
              <Controller
                name="name"
                control={methods.control}
                defaultValue=""
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    autoFocus
                    placeholder="Group Name"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <LoadingButton
              type="submit"
              loading={methods.formState.isSubmitting}
              disabled={methods.formState.isSubmitting || !methods.formState.isValid || isPending}
            >
              Create
            </LoadingButton>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  )
}