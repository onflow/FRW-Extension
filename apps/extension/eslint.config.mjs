import storybook from 'eslint-plugin-storybook';
import { baseConfig, testConfig, buildConfig } from '../../eslint.config.base.mjs';

const config = [
  // Base config for all files
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.git/**',
      '**/coverage/**',
      '**/playwright/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/_raw/**',
    ],
  },
  // JavaScript and TypeScript files
  {
    ...baseConfig,
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
  // Test files specific config
  {
    ...baseConfig,
    ...testConfig,
    files: [
      'e2e/**/*',
      'playwright.config.ts',
      'vitest.config.ts',
      'vitest.init.ts',
      '**/*.test.ts',
      '**/__tests__/**',
    ],
    languageOptions: {
      ...baseConfig.languageOptions,
      parserOptions: {
        project: './tsconfig.test.json',
      },
    },
  },
  // Build files specific config
  {
    ...baseConfig,
    ...buildConfig,
    files: ['build/**/*.{js,jsx,ts,tsx}', '.storybook/**/*.{js,jsx,ts,tsx}'],
  },
  // Background-specific config for chrome extension
  {
    files: ['**/src/background/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'Do not use window in background scripts - use globalThis instead',
        },
        {
          name: 'document',
          message: 'DOM APIs are not available in background scripts',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui/*', '@/ui/**'],
              message: 'Background cannot import from UI layer',
            },
          ],
        },
      ],
    },
  },
  // Core folder import restrictions
  {
    files: ['**/src/core/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui/*', '@/ui/**'],
              message: 'Core cannot import from UI layer',
            },
            {
              group: ['@/background/*', '!@/background/webapi/**'],
              message: 'Core can only import webapi from background',
            },
          ],
        },
      ],
    },
  },
  // Core service specific restrictions
  {
    files: ['**/src/core/service/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui/*', '@/ui/**'],
              message: 'Core services cannot import from UI layer',
            },
            {
              group: ['@/background/*', '!@/background/webapi/**'],
              message: 'Core services can only import webapi from background',
            },
            {
              group: ['@/content-script/*', '@/content-script/**'],
              message: 'Core services cannot import from content scripts',
            },
            {
              group: ['@/core/*', '!@/core/service/**', '!@/core/utils/**'],
              message: 'Core services can only import from core/service or core/utils',
            },
          ],
        },
      ],
    },
  },
  // UI-specific config to block imports from other layers
  {
    files: ['**/src/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/core/*', '@/core/**'],
              message: 'UI cannot import from Core layer',
            },
            {
              group: ['@/background/*', '@/background/**'],
              message: 'UI cannot import from Background layer',
            },
          ],
        },
      ],
    },
  },
  // Exception for WalletContext and useWallet - they need the controller type
  {
    files: ['**/src/ui/utils/WalletContext.tsx', '**/src/ui/hooks/use-wallet.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/core/*', '@/core/**'],
              message: 'UI cannot import from Core layer',
            },
            // Allow importing types from background controller for these specific files
            {
              group: [
                '@/background/*',
                '!@/background/controller/wallet',
                '!@/background/controller/serviceDefinition',
              ],
              message: 'Only wallet controller types can be imported here',
            },
          ],
        },
      ],
    },
  },
  // UI reducers must be pure - only import from shared
  {
    files: ['**/src/ui/reducers/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui/*', '@/ui/**'],
              message: 'Reducers must be pure - cannot import from other UI modules',
            },
            {
              group: ['@/core/*', '@/core/**'],
              message: 'Reducers must be pure - cannot import from Core layer',
            },
            {
              group: ['@/background/*', '@/background/**'],
              message: 'Reducers must be pure - cannot import from Background layer',
            },
            {
              group: ['@/content-script/*', '@/content-script/**'],
              message: 'Reducers must be pure - cannot import from content scripts',
            },
            {
              group: ['@/data-model/*', '@/data-model/**'],
              message: 'Reducers must be pure - cannot import from data model',
            },
            {
              group: ['@/extension-shared/*', '@/extension-shared/**'],
              message: 'Reducers must be pure - cannot import from extension-shared',
            },
          ],
        },
      ],
    },
  },
  // Content script restrictions
  {
    files: ['**/src/content-script/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui/*', '@/ui/**'],
              message: 'Content scripts cannot import from UI layer',
            },
            {
              group: ['@/core/*', '@/core/**'],
              message: 'Content scripts cannot import from Core layer',
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
];

export default config;
