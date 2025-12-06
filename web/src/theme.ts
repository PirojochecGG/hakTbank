import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFDD2D',
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontSize: 'clamp(1.5rem, 5vw, 2.125rem)',
    },
    h6: {
      fontSize: 'clamp(1rem, 3vw, 1.25rem)',
    },
    body1: {
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          minHeight: '44px',
          '@media (max-width: 600px)': {
            minHeight: '40px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            paddingLeft: 0,
            paddingRight: 0,
          },
        },
      },
    },
  },
})
