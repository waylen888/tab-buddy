
import { IconButton, IconButtonProps } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';

const DialogCloseButton: React.FC<IconButtonProps> = (props) => {
  return (
    <IconButton
      aria-label="close"
      className="dialog-close-button"
      sx={{
        position: 'absolute',
        right: 10,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
      {...props}
    >
      <CloseIcon />
    </IconButton>
  )
}

export default DialogCloseButton;