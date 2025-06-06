// Enhanced Chrome API mock for Storybook - must be at the very top
(() => {
  const mockStorageArea = {
    get: () => Promise.resolve({}),
    set: () => Promise.resolve(),
    remove: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };

  const mockOnChanged = {
    addListener: () => {},
    removeListener: () => {},
    hasListener: () => false,
  };

  const chromeApiMock = {
    storage: {
      local: mockStorageArea,
      session: mockStorageArea,
      sync: mockStorageArea,
      onChanged: mockOnChanged,
    },
    runtime: {
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
      },
    },
    i18n: {
      getMessage: (messageName: string, substitutions?: unknown) => {
        // Simple fallback - just return the message name for now
        return messageName || 'Missing translation';
      },
    },
  };

  // Set on both global and window immediately
  (globalThis as any).chrome = chromeApiMock;
  if (typeof window !== 'undefined') {
    (window as any).chrome = chromeApiMock;
  }
  if (typeof global !== 'undefined') {
    (global as any).chrome = chromeApiMock;
  }
})();

// Mock useProfiles hook at the global level
if (typeof window !== 'undefined') {
  (window as any).__STORYBOOK_MOCKS__ = {
    useProfiles: () => ({
      fetchProfileData: () => {},
      clearProfileData: () => {},
      currentWallet: null,
      mainAddress: '',
      evmAddress: '',
      childAccounts: [],
      evmWallet: null,
      userInfo: null,
      otherAccounts: [],
      walletList: [],
      currentBalance: '0',
      parentAccountStorageBalance: null,
      parentWallet: null,
      parentWalletIndex: -1,
      evmLoading: false,
      mainAddressLoading: false,
      profileIds: [],
      activeAccountType: 'none',
      noAddress: false,
      registerStatus: false,
      canMoveToChild: false,
      currentWalletList: [],
      payer: false,
      network: 'mainnet',
      pendingAccountTransactions: [],
    }),
  };
}

import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-webpack5';
import { themes, ensure } from 'storybook/theming';

import messages from '../src/messages.json';
import themeOptions from '../src/ui/style/LLTheme'; // Import your theme options

import '../src/ui/style/fonts.css';

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
        light: theme,
        dark: theme,
      },
      defaultTheme: 'dark',
    }),
  ],
};

export default preview;
