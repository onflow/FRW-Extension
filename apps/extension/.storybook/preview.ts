// Enhanced Chrome API mock for Storybook - must be at the very top

import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-webpack5';
import { themes } from 'storybook/theming';

import messages from '../src/messages.json';
import themeOptions from '../src/ui/style/LLTheme'; // Import your theme options

import '../src/ui/style/fonts.css';

// Add this mock
if (typeof global.chrome === 'undefined' || typeof global.chrome.i18n === 'undefined') {
  global.chrome = {
    i18n: {
      getMessage: (messageName: string, substitutions?: unknown) => {
        const entry = messages[messageName as keyof typeof messages];
        let msg = entry ? entry.message : messageName;
        if (substitutions) {
          if (Array.isArray(substitutions)) {
            // Replace $1$, $2$, ... with array values
            substitutions.forEach((val, idx) => {
              msg = msg.replace(new RegExp(`\\$[^$]+\\$`), String(val));
            });
            return msg;
          }
          if (typeof substitutions === 'object') {
            // Replace $key$ with object values
            Object.entries(substitutions).forEach(([key, val]) => {
              msg = msg.replace(new RegExp(`\\$${key}\\$`, 'g'), String(val));
            });
            return msg;
          }
        }
        return msg;
      },
    },
    storage: {
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        clear: () => Promise.resolve(),
      },
      session: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        clear: () => Promise.resolve(),
      },
      sync: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        clear: () => Promise.resolve(),
      },
    },
  } as unknown as typeof chrome; // Use 'as any' to simplify mocking complex global objects
}

const theme = createTheme(themeOptions); // Create a theme instance

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on.*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: themes.dark,
    },
  },

  decorators: [
    withThemeFromJSXProvider({
      GlobalStyles: CssBaseline,
      Provider: ThemeProvider,
      themes: {
        // Provide your custom themes here
        dark: theme,
      },
      defaultTheme: 'dark',
    }),
  ],
};

export default preview;
