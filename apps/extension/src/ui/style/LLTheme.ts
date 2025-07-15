import { type ThemeOptions } from '@mui/material/styles';

import {
  COLOR_GREEN_FLOW_DARKMODE_00EF8B,
  COLOR_ERROR_RED_E54040,
  COLOR_ORANGE_WARNING_FF8A00,
  COLOR_SUCCESS_GREEN_41CC5D,
  COLOR_PRIMARY_DARK_121212,
  COLOR_WHITE_FFFFFF,
  COLOR_MEDIUM_GRAY_BABABA,
  COLOR_GRAY_808080,
  COLOR_LIGHT_GRAY_E6E6E6,
  COLOR_OFF_WHITE_F9F9F9,
  COLOR_OFF_WHITE_FAFAFA,
  COLOR_BLACK_ALPHA_80_000000CC,
  COLOR_DARK_GRAY_333333,
  COLOR_VERY_DARK_GRAY_222222,
  COLOR_CHARCOAL_GRAY_4C4C4C,
  COLOR_MEDIUM_DARK_GRAY_5E5E5E,
  COLOR_MEDIUM_GRAY_787878,
  COLOR_BACKGROUND_CARD_232323,
  COLOR_PRIMARY_TEXT_282828,
} from './color';

import './fonts.css';

const themeOptions: ThemeOptions = {
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
          marginTop: '0px',
        },
        // ... other global classes or element selectors
      },
    },
  },
  palette: {
    mode: 'dark',
    text: {
      primary: COLOR_OFF_WHITE_F9F9F9,
      secondary: COLOR_MEDIUM_GRAY_BABABA,
      // @ts-expect-error nonselect for the header text
      nonselect: COLOR_GRAY_808080,
      title: COLOR_LIGHT_GRAY_E6E6E6,
      error: COLOR_ERROR_RED_E54040,
      good: COLOR_ORANGE_WARNING_FF8A00,
      increase: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
      decrease: COLOR_ERROR_RED_E54040,
    },
    testnet: {
      main: COLOR_ORANGE_WARNING_FF8A00,
      light: `${COLOR_ORANGE_WARNING_FF8A00}29`,
    },
    crescendo: {
      main: '#CCAF21',
      light: '#CCAF2129',
    },
    success: {
      main: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
      light: `${COLOR_SUCCESS_GREEN_41CC5D}29`,
      contrastText: COLOR_BLACK_ALPHA_80_000000CC,
    },
    error: {
      main: COLOR_ERROR_RED_E54040,
      light: `${COLOR_ERROR_RED_E54040}29`,
    },
    background: {
      default: COLOR_PRIMARY_DARK_121212,
      paper: COLOR_PRIMARY_TEXT_282828,
      card: COLOR_BACKGROUND_CARD_232323,
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      main: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
      light: COLOR_WHITE_FFFFFF,
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
      contrastText: COLOR_BLACK_ALPHA_80_000000CC,
    },
    secondary: {
      light: '#0066ff',
      main: COLOR_OFF_WHITE_FAFAFA,
      // dark: will be calculated from palette.secondary.main,
      contrastText: COLOR_DARK_GRAY_333333,
    },
    info: {
      main: '#4f4f4f',
      contrastText: COLOR_OFF_WHITE_F9F9F9,
    },
    info3: {
      main: COLOR_DARK_GRAY_333333,
      dark: COLOR_VERY_DARK_GRAY_222222,
      contrastText: COLOR_WHITE_FFFFFF,
    },
    yellow: {
      main: '#F3EA5F',
    },
    neutral: {
      main: COLOR_PRIMARY_TEXT_282828,
      text: '#8C9BAB',
      light: '#343535',
      contrastText: COLOR_WHITE_FFFFFF,
    },
    neutral1: {
      main: '#8C9BAB',
      light: '#8C9BAB29',
      contrastText: COLOR_WHITE_FFFFFF,
    },
    neutral2: {
      main: COLOR_MEDIUM_DARK_GRAY_5E5E5E,
    },
    action: {
      disabledBackground: '#888888',
    },
    line: {
      main: COLOR_CHARCOAL_GRAY_4C4C4C,
    },
    icon: {
      navi: COLOR_MEDIUM_GRAY_787878,
    },
    up: {
      main: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
    },
  },
  typography: {
    allVariants: {
      color: COLOR_OFF_WHITE_F9F9F9,
      lineHeight: 1.6,
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
      fontWeight: 600,
    },
  },
};

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    info3: true;
  }
}

declare module '@mui/material/styles' {
  interface TypeBackground {
    card: string;
  }
}

export default themeOptions;
