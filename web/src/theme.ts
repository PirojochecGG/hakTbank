import { createTheme } from '@mui/material/styles';

const tBankTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD600', // Жёлтый Т-Банка
      light: '#FFE44D',
      dark: '#FFB300',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FFFFFF', // Белый
      contrastText: '#000000',
    },
    background: {
      default: '#000000', // Чёрный фон
      paper: '#1A1A1A',   // Тёмно-серый для карточек
    },
    text: {
      primary: '#FFFFFF', // Белый текст
      secondary: '#B0B0B0', // Светло-серый
    },
    divider: '#333333',
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
        containedPrimary: {
          backgroundColor: '#FFD600',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#FFE44D',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A1A1A',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid #333333',
        },
      },
    },
  },
});

export default tBankTheme;