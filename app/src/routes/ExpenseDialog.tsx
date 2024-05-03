import { Button, DialogContent, DialogTitle, Input, Modal, ModalClose, ModalDialog, Stack, TextField } from "@mui/joy";
import { Controller, Form, FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Group } from "../model";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";

interface ExpenseCreateForm {
  description: string;
  amount: string;
}

export default function ExpenseDialog() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const methods = useForm<ExpenseCreateForm>({})
  const params = useParams()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: ExpenseCreateForm) => {
      return fetch(`/api/group/${params.id}/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      }).then(res => {
        if (!res.ok) {
          throw new Error(res.statusText)
        }
        return res.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['group', params.id, 'expenses']
      })
    },

  })
  const handleSubmit = async (values: ExpenseCreateForm) => {
    try {
      console.debug(`submit`, values)
      await mutateAsync(values)
      navigate(-1)
      enqueueSnackbar(`expense created`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    } finally {
    }
  }

  return (
    <Modal open={true} onClose={(_, reason) => {
      if (reason === 'closeClick') {
        navigate(-1)
      }
    }}>
      <ModalDialog>
        <ModalClose />
        <DialogTitle>
          Expense
        </DialogTitle>
        <DialogContent>
          Create
        </DialogContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <Stack gap={2}>
              <Controller
                name="amount"
                control={methods.control}
                defaultValue=""
                rules={{ required: true }}
                render={({ field }) => (
                  <Input
                    {...field}
                    autoFocus
                    type="number"
                    placeholder="0.00"
                  />
                )}
              />
              <Controller
                name="description"
                control={methods.control}
                defaultValue=""
                rules={{ required: true }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Description"
                  />
                )}
              />
              <Button
                variant="solid"
                type="submit"
                loading={methods.formState.isSubmitting}
                disabled={methods.formState.isSubmitting || !methods.formState.isValid || isPending}
              >
                Create
              </Button>
            </Stack>
          </form>
        </FormProvider>
      </ModalDialog>
    </Modal>
  )
}