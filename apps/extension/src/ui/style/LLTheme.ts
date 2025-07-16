import { type ThemeOptions } from '@mui/material/styles';

import {
  COLOR_GREEN_FLOW_00EF8B,
  COLOR_RED_ERROR_E54040,
  COLOR_ORANGE_WARNING_FF8A00,
  COLOR_GREEN_SUCCESS_41CC5D,
  COLOR_DARK_GRAY_121212,
  COLOR_WHITE_FFFFFF,
  COLOR_DARK_GRAY_BABABA,
  COLOR_DARK_GRAY_808080,
  COLOR_DARK_GRAY_E6E6E6,
  COLOR_DARK_GRAY_F9F9F9,
  COLOR_DARK_GRAY_FAFAFA,
  COLOR_BLACK_ALPHA_80_000000CC,
  COLOR_DARK_GRAY_333333,
  COLOR_DARK_GRAY_222222,
  COLOR_DARK_GRAY_4C4C4C,
  COLOR_DARK_GRAY_5E5E5E,
  COLOR_DARK_GRAY_787878,
  COLOR_DARK_GRAY_232323,
  COLOR_DARK_GRAY_282828,
  COLOR_DARK_GRAY_0A0A0B,
  COLOR_DARK_GRAY_2A2A2A,
  COLOR_DARK_GRAY_1C1C1C,
  COLOR_DARK_GRAY_444444,
  COLOR_DARK_GRAY_242424,
  COLOR_BLUE_0052FF,
  COLOR_BLUE_3898FF,
  COLOR_ORANGE_FF6D24,
  COLOR_BLUE_1A5CFF,
  COLOR_PURPLE_8E24AA,
  COLOR_YELLOW_F3EA5F,
  COLOR_YELLOW_CCAF21,
  COLOR_BLUE_0066FF,
  COLOR_DARK_GRAY_4F4F4F,
  COLOR_BLUE_GRAY_8C9BAB,
  COLOR_DARK_GRAY_343535,
  COLOR_DARK_GRAY_888888,
  COLOR_LIGHT_GRAY_E5E5E54D,
  COLOR_DARK_GRAY_181818,
  COLOR_ORANGE_FF3D00,
  COLOR_ORANGE_FF4C0029,
  COLOR_ORANGE_FF8A0029,
  COLOR_DARK_GRAY_484848,
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
      primary: COLOR_DARK_GRAY_F9F9F9,
      secondary: COLOR_DARK_GRAY_BABABA,
      // @ts-expect-error nonselect for the header text
      nonselect: COLOR_DARK_GRAY_808080,
      title: COLOR_DARK_GRAY_E6E6E6,
      error: COLOR_RED_ERROR_E54040,
      good: COLOR_ORANGE_WARNING_FF8A00,
      increase: COLOR_GREEN_FLOW_00EF8B,
      decrease: COLOR_RED_ERROR_E54040,
    },
    testnet: {
      main: COLOR_ORANGE_WARNING_FF8A00,
      light: `${COLOR_ORANGE_WARNING_FF8A00}29`,
    },
    crescendo: {
      main: COLOR_YELLOW_CCAF21,
      light: `${COLOR_YELLOW_CCAF21}29`,
    },
    success: {
      main: COLOR_GREEN_FLOW_00EF8B,
      light: `${COLOR_GREEN_SUCCESS_41CC5D}29`,
      contrastText: COLOR_BLACK_ALPHA_80_000000CC,
    },
    error: {
      main: COLOR_RED_ERROR_E54040,
      light: `${COLOR_RED_ERROR_E54040}29`,
    },
    background: {
      default: COLOR_DARK_GRAY_121212,
      paper: COLOR_DARK_GRAY_282828,
      card: COLOR_DARK_GRAY_232323,
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      main: COLOR_GREEN_FLOW_00EF8B,
      light: COLOR_WHITE_FFFFFF,
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
      contrastText: COLOR_BLACK_ALPHA_80_000000CC,
    },
    secondary: {
      light: COLOR_BLUE_0066FF,
      main: COLOR_DARK_GRAY_FAFAFA,
      // dark: will be calculated from palette.secondary.main,
      contrastText: COLOR_DARK_GRAY_333333,
    },
    info: {
      main: COLOR_DARK_GRAY_4F4F4F,
      contrastText: COLOR_DARK_GRAY_F9F9F9,
    },
    info3: {
      main: COLOR_DARK_GRAY_333333,
      dark: COLOR_DARK_GRAY_222222,
      contrastText: COLOR_WHITE_FFFFFF,
    },
    yellow: {
      main: COLOR_YELLOW_F3EA5F,
      accent: COLOR_YELLOW_CCAF21,
    },
    neutral: {
      main: COLOR_DARK_GRAY_282828,
      text: COLOR_BLUE_GRAY_8C9BAB,
      light: COLOR_DARK_GRAY_343535,
      contrastText: COLOR_WHITE_FFFFFF,
    },
    neutral1: {
      main: COLOR_BLUE_GRAY_8C9BAB,
      light: `${COLOR_BLUE_GRAY_8C9BAB}29`,
      contrastText: COLOR_WHITE_FFFFFF,
    },
    neutral2: {
      main: COLOR_DARK_GRAY_5E5E5E,
    },
    action: {
      disabledBackground: COLOR_DARK_GRAY_888888,
    },
    line: {
      main: COLOR_DARK_GRAY_4C4C4C,
    },
    icon: {
      navi: COLOR_DARK_GRAY_787878,
    },
    up: {
      main: COLOR_GREEN_FLOW_00EF8B,
    },
    // Additional theme colors
    darkBackground: {
      main: COLOR_DARK_GRAY_0A0A0B,
    },
    darkGray: {
      main: COLOR_DARK_GRAY_2A2A2A,
      light: COLOR_DARK_GRAY_1C1C1C,
      dark: COLOR_DARK_GRAY_444444,
      card: COLOR_DARK_GRAY_242424,
    },
    blue: {
      primary: COLOR_BLUE_0052FF,
      secondary: COLOR_BLUE_3898FF,
      accent: COLOR_BLUE_1A5CFF,
      light: COLOR_BLUE_0066FF,
    },
    orange: {
      warning: COLOR_ORANGE_FF6D24,
      emulator: COLOR_ORANGE_FF3D00,
      emulatorAlpha: COLOR_ORANGE_FF4C0029,
      testnetAlpha: COLOR_ORANGE_FF8A0029,
    },
    purple: {
      main: COLOR_PURPLE_8E24AA,
    },
    blueGray: {
      main: COLOR_BLUE_GRAY_8C9BAB,
      light: COLOR_DARK_GRAY_343535,
    },
    lightGray: {
      alpha: COLOR_LIGHT_GRAY_E5E5E54D,
    },
    story: {
      background: COLOR_DARK_GRAY_181818,
    },
    profile: {
      darkGray: COLOR_DARK_GRAY_484848,
    },
  },
  typography: {
    allVariants: {
      color: COLOR_DARK_GRAY_F9F9F9,
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

  interface Palette {
    darkBackground: {
      main: string;
    };
    darkGray: {
      main: string;
      light: string;
      dark: string;
      card: string;
    };
    blue: {
      primary: string;
      secondary: string;
      accent: string;
      light: string;
    };
    orange: {
      warning: string;
      emulator: string;
      emulatorAlpha: string;
      testnetAlpha: string;
    };
    purple: {
      main: string;
    };
    yellow: {
      main: string;
      accent: string;
    };
    blueGray: {
      main: string;
      light: string;
    };
    lightGray: {
      alpha: string;
    };
    story: {
      background: string;
    };
    profile: {
      darkGray: string;
    };
    icon: {
      navi: string;
    };
    info3: {
      main: string;
      dark: string;
      contrastText: string;
    };
  }

  interface PaletteOptions {
    darkBackground?: {
      main: string;
    };
    darkGray?: {
      main: string;
      light: string;
      dark: string;
      card: string;
    };
    blue?: {
      primary: string;
      secondary: string;
      accent: string;
      light: string;
    };
    orange?: {
      warning: string;
      emulator: string;
      emulatorAlpha: string;
      testnetAlpha: string;
    };
    purple?: {
      main: string;
    };
    yellow?: {
      main: string;
      accent: string;
    };
    blueGray?: {
      main: string;
      light: string;
    };
    lightGray?: {
      alpha: string;
    };
    story?: {
      background: string;
    };
    profile?: {
      darkGray: string;
    };
    icon?: {
      navi: string;
    };
    info3?: {
      main: string;
      dark: string;
      contrastText: string;
    };
  }
}

export default themeOptions;
