import { PaletteMode, createTheme, dialogActionsClasses, dialogTitleClasses, iconButtonClasses, useMediaQuery } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { ReactNode, useMemo } from 'react';
import { useUserSetting } from './UserSettingProvider';

const useTheme = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const setting = useUserSetting()
  const theme = useMemo(() => createTheme({
    palette: {
      mode: (setting?.themeMode as PaletteMode) || (prefersDarkMode ? "dark" : "light"),
    },
    components: {
      MuiTextField: {
        defaultProps: {
          size: "small",
        }
      },
      MuiSelect: {
        defaultProps: {
          size: "small",
        }
      },
      MuiDialog: {
        defaultProps: {
          fullWidth: true,
        },
        styleOverrides: {
          root: ({ theme, ownerState }) => ({
            [`& .${dialogTitleClasses.root}`]: {
              paddingTop: `calc(${theme.spacing(2)} + ${ownerState.fullScreen ? "env(safe-area-inset-top)" : "0px"})`,
            },
            [`& .${dialogActionsClasses.root}`]: {
              paddingBottom: `calc(${theme.spacing(1)} + ${ownerState.fullScreen ? "env(safe-area-inset-bottom)" : "0px"})`,
            },
            [`& .dialog-close-button.${iconButtonClasses.root}`]: {
              top: `calc(${theme.spacing(1.5)} + ${ownerState.fullScreen ? "env(safe-area-inset-top)" : "0px"})`,
            }
            // paddingTop: "env(safe-area-inset-top)",
            // paddingBottom: "env(safe-area-inset-bottom)",
          })
        },
      },
    }
  }), [setting, prefersDarkMode])
  return theme
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useTheme();
  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  )
}
