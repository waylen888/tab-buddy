import { ThemeProvider as MuiThemeProvider, PaletteMode, createTheme, useMediaQuery } from '@mui/material';
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
        }
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
