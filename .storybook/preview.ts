import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-webpack5';
import { themes, ensure } from 'storybook/theming';

import messages from '../src/messages.json';
import themeOptions from '../src/ui/style/LLTheme'; // Import your theme options

import '../src/ui/style/fonts.css';

// Add this mock
if (typeof global.chrome === 'undefined' || typeof global.chrome.i18n === 'undefined') {
  global.chrome = {
    i18n: {
      getMessage: (messageName: string, substitutions?: unknown) => {
        if (substitutions) {
          if (Array.isArray(substitutions)) {
            // Simple substitution for array format
            return messageName + ': ' + substitutions.join(', ');
          }
          // For object substitutions, you might want a more complex replacement logic
          return messageName + ': ' + JSON.stringify(substitutions);
        }
        if (messages[messageName as keyof typeof messages]) {
          return messages[messageName as keyof typeof messages].message;
        }
        return messageName;
      },
    },
  } as unknown as typeof chrome; // Use 'as any' to simplify mocking complex global objects
}

const theme = createTheme(themeOptions); // Create a theme instance

const preview: Preview = {
  parameters: {
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
