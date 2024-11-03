import { createTheme } from '@mui/material/styles';
import { Theme as SystemTheme } from '@mui/system';
import './fonts.css';

const theme: SystemTheme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '.registerBox': {
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          padding: '20px 40px 40px',
          gap: '8px',
        },
        '.welcomeBox': {
          display: 'flex',
          flexDirection: 'column',
          width: '625px',
          height: 'auto',
          borderRadius: '24px',
          marginTop:'0px',
        },
        // ... other global classes or element selectors
      },
    },
  },
  palette: {
    mode: 'dark',
    text: {
      primary: '#F9F9F9',
      secondary: '#BABABA',
      // @ts-expect-error nonselect for the header text
      nonselect: '#808080',
      title: '#E6E6E6',
      error: '#E54040',
      good: '#FF8A00',
      increase:'#41CC5D',
      decrease:'#E54040',
    },
    testnet: {
      main:'#FF8A00',
      light:'#FF8A0029',
    },
    crescendo:{
      main:'#CCAF21',
      light:'#CCAF2129'
    },
    success: {
      main: '#41CC5D',
      light: '#41CC5D29',
      contrastText: '#000000CC',
    },
    error: {
      main: '#E54040',
      light: '#E5404029',
    },
    background: {
      default: '#121212',
      paper: '#282828',
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#41CC5D',
      light:'#FFFFFF',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
      contrastText: '#000000CC',
    },
    secondary: {
      light: '#0066ff',
      main: '#FAFAFA',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#333333',
    },
    info: {
      main: '#4f4f4f',
      contrastText: '#F9F9F9',
    },
    info3: {
      main: '#333333',
      dark: '#222222',
      contrastText: '#FFFFFF',
    },
    yellow: {
      main: '#F3EA5F'
    },
    neutral: {
      main: '#282828',
      text: '#8C9BAB',
      light: '#343535',
      contrastText: '#FFFFFF',
    },
    neutral1: {
      main: '#8C9BAB',
      light: '#8C9BAB29',
      contrastText: '#FFFFFF',
    },
    neutral2: {
      main: '#5e5e5e',
    },
    action: {
      disabledBackground: '#888888',
    },
    line: {
      main: '#4C4C4C',
    },
    icon: {
      navi: '#787878',
    },
    up: {
      main: '#00EF8B'
    }
  },
  typography: {
    allVariants: {
      color: '#F9F9F9',
      lineHeight: 1.6
    },
    fontFamily: ['Inter', 'sans-serif'].join(','),
    h1: {
      fontFamily: 'e-Ukraine,sans-serif',
      fontWeight: 'Bold',
    },
    h2: {
      fontFamily: 'e-Ukraine,sans-serif',
      fontWeight: 'Bold',
    },
    h3: {
      fontFamily: 'e-Ukraine,sans-serif',
      fontWeight: 'Bold',
    },
    h4: {
      fontFamily: 'e-Ukraine,sans-serif',
      fontWeight: 'Bold',
    },
    h5: {
      fontFamily: 'e-Ukraine,sans-serif',
      fontWeight: 'Bold',
    },
    h6: {
      fontFamily: 'e-Ukraine,sans-serif',
      fontWeight: 'Bold',
    },
    body1: {
      fontFamily: 'Inter,sans-serif',
    },
    overline: {
      fontFamily: 'Inter,sans-serif',
      textTransform: 'none',
    },
    caption: {
      fontFamily: 'Inter,sans-serif',
    },
    subtitle1: {
      fontFamily: 'Inter,sans-serif',
      fontWeight: 600
    }
  },
});

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    info3: true;
  }
}


export default theme;
