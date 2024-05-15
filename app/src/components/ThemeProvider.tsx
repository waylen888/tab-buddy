import { ThemeProvider as MuiThemeProvider, PaletteMode, createTheme, useMediaQuery } from '@mui/material';
import { ReactNode, useMemo } from 'react';
import { useUserSetting } from './UserSettingProvider';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const setting = useUserSetting()
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => createTheme({
    palette: {
      mode: !!setting.themeMode
        ? setting.themeMode as PaletteMode
        : (prefersDarkMode ? 'dark' : 'light'),
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
        }
      },
    }
  }), [setting, prefersDarkMode])

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  )
}

export const DefaultThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useMemo(() => createTheme({
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
        }
      },
    }
  }), [])

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  )
}