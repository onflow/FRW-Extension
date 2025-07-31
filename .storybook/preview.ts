// Enhanced Chrome API mock for Storybook - must be at the very top

import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-webpack5';
import { themes } from 'storybook/theming';

import messages from '../src/messages.json';
import themeOptions from '../src/ui/style/LLTheme'; // Import your theme options

import '../src/ui/style/fonts.css';

// Enhanced Chrome API mock for Storybook
const createChromeMock = () => ({
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
  runtime: {
    id: 'mock-extension-id',
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    sendMessage: () => Promise.resolve({}),
    onConnect: {
      addListener: () => {},
      removeListener: () => {},
    },
    connect: () => ({
      name: 'mock-port',
      postMessage: () => {},
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
      },
      onDisconnect: {
        addListener: () => {},
        removeListener: () => {},
      },
      disconnect: () => {},
    }),
  },
  tabs: {
    query: () => Promise.resolve([]),
    sendMessage: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    create: () => Promise.resolve({ id: 1, url: 'https://example.com' }),
    remove: () => Promise.resolve(),
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
});

// Always ensure chrome is available with all required APIs
if (typeof global.chrome === 'undefined') {
  global.chrome = createChromeMock() as unknown as typeof chrome;
} else {
  // If chrome already exists, ensure all required APIs are available
  const mock = createChromeMock();
  global.chrome = {
    ...global.chrome,
    ...mock,
    runtime: {
      ...global.chrome.runtime,
      ...mock.runtime,
    },
    tabs: {
      ...global.chrome.tabs,
      ...mock.tabs,
    },
  } as unknown as typeof chrome;
}

// Also ensure chrome is available on window object
if (typeof window !== 'undefined') {
  if (typeof window.chrome === 'undefined') {
    window.chrome = createChromeMock() as unknown as typeof chrome;
  } else {
    const mock = createChromeMock();
    window.chrome = {
      ...window.chrome,
      ...mock,
      runtime: {
        ...window.chrome.runtime,
        ...mock.runtime,
      },
      tabs: {
        ...window.chrome.tabs,
        ...mock.tabs,
      },
    } as unknown as typeof chrome;
  }
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
