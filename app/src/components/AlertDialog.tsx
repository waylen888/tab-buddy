import { LoadingButton } from "@mui/lab"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import { createContext, useCallback, useContext, useState } from "react"

const ctx = createContext<{
  openFunc: (props: DialogProps) => void

}>({} as any)

interface DialogProps {
  title?: string
  content?: React.ReactNode | string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
}

export const AlertDialogProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [open, setOpen] = useState(false)
  const [props, setProps] = useState<DialogProps>({})
  const openFunc = useCallback((props: DialogProps) => {
    setProps(props)
    setOpen(true)
  }, [])

  const handleConfirm = () => {
    props.onConfirm?.();
    setOpen(false);
  }

  const handleCancel = () => {
    setOpen(false);
  }

  return (
    <ctx.Provider value={{ openFunc }}>
      <Dialog open={open}>
        <DialogTitle>
          {props.title}
        </DialogTitle>
        <DialogContent dividers>
          {props.content}
        </DialogContent>
        <DialogActions>
          <LoadingButton
            sx={{
              display: props.cancelText ? undefined : 'none'
            }}
            onClick={handleConfirm}
          >
            {props.confirmText}
          </LoadingButton>

          <Button
            sx={{
              display: props.cancelText ? undefined : 'none'
            }}
            onClick={handleCancel}
          >
            {props.cancelText}
          </Button>
        </DialogActions>
      </Dialog>
      {children}
    </ctx.Provider>
  )
}

export const useAlertDialog = () => {
  const { openFunc } = useContext(ctx)
  return openFunc
}
