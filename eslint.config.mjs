// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

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
  }, // JavaScript and TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        chrome: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
      react: {
        version: 'detect', // Change from '17' to 'detect'
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // Let unused-imports handle this
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],

      // Unused imports rules
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // React rules
      'react/react-in-jsx-scope': 'error', // Required for React 17
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Import rules
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // General rules
      'no-console': ['error'],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'CallExpression[callee.name="consoleLog"]',
          message: 'Remove consoleLog once debugging is done',
        },
      ],
    },
  }, // Test files specific config
  {
    files: [
      'e2e/**/*',
      'playwright.config.ts',
      'vitest.config.ts',
      'vitest.init.ts',
      '**/*.test.ts',
      '**/__tests__/**',
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.test.json',
      },
    },
    rules: {
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': ['off'],
    },
  }, // Build files specific config
  {
    files: ['build/**/*.{js,jsx,ts,tsx}', '.storybook/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': ['off'],
    },
  }, // Background-specific config for chrome extension
  {
    files: ['**/background/**/*.{js,jsx,ts,tsx}'],
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
              message: 'UI components/modules cannot be imported into background scripts',
            },
            // Block relative imports outside background folder
            {
              group: [
                '../shared/*',
                '../shared/**',
                '../ui/*',
                '../ui/**',
                '../content-script/*',
                '../content-script/**',
                '../../shared/*',
                '../../shared/**',
                '../../ui/*',
                '../../ui/**',
                '../../content-script/*',
                '../../content-script/**',
              ],
              message:
                'Files in background folder must use aliases (@/shared/*, etc.) instead of relative paths outside background',
            },
          ],
        },
      ],
    },
  }, // Core folder cannot import outside of core without aliases
  {
    files: ['**/packages/core/src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui/*', '@/ui/**'],
              message: 'UI components/modules cannot be imported into core',
            },
            // Block relative imports outside core folder
            {
              group: [
                '../shared/*',
                '../shared/**',
                '../ui/*',
                '../ui/**',
                '../content-script/*',
                '../content-script/**',
                '../../shared/*',
                '../../shared/**',
                '../../ui/*',
                '../../ui/**',
                '../../content-script/*',
                '../../content-script/**',
              ],
              message:
                'Files in core folder must use aliases (@/shared/*, etc.) instead of relative paths outside core',
            },
          ],
        },
      ],
    },
  }, // Restrict imports from core/service
  {
    files: ['**/packages/core/src/service/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Block all imports from @/ except @/shared and @/core/service (within service)
            {
              group: ['@/*', '!@/shared', '!@/shared/**', '!@/core/service', '!@/core/service/**'],
              message: 'Files in core/service can only import from @/shared/* or within service',
            },
            // Block imports from background/* except background/webapi and core/*
            {
              group: ['background/*', '!background/webapi', '!background/webapi/**'],
              message:
                'Files in core/service can only import from background/webapi/* or within core',
            },
            // Block imports from core/* except core/utils and core/service
            {
              group: [
                'core/*',
                '!core/utils',
                '!core/utils/**',
                '!core/service',
                '!core/service/**',
              ],
              message: 'Files in core/service can only import from core/utils/* or within service',
            },
            // Block UI imports
            {
              group: ['ui/*', 'ui/**'],
              message: 'Files in core/service cannot import from UI',
            },
            // Block relative imports that go outside allowed directories
            {
              group: [
                '../*',
                '!../utils',
                '!../utils/*',
                '!../utils/**',
                '!../../background/webapi',
                '!../../background/webapi/*',
                '!../../background/webapi/**',
              ],
              message:
                'Files in core/service can only import from core/utils/* or background/webapi/* or within service',
            },
            {
              group: ['../../*', '!../../utils/**'],
              message: 'Files in core/service subdirectories can only import from core/utils/*',
            },
            // Block ALL relative imports to shared - force use of @/shared alias
            {
              group: [
                '../shared/**',
                '../../shared/**',
                '../../../shared/**',
                '../../../../shared/**',
              ],
              message: 'Use @/shared/* alias instead of relative imports to shared',
            },
          ],
        },
      ],
    },
  }, // Specific rules for core/service/keyring folder
  {
    files: ['**/src/core/service/keyring/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Block all imports from @/ except @/shared, @/core/service, and @/core/utils
            {
              group: [
                '@/*',
                '!@/shared',
                '!@/shared/**',
                '!@/core/service',
                '!@/core/service/**',
                '!@/core/utils',
                '!@/core/utils/**',
              ],
              message:
                'Files in core/service/keyring can only import from @/shared/*, @/core/utils/* or within service',
            },
            // Block imports from background/* except background/webapi and core/*
            {
              group: ['background/*', '!background/webapi', '!background/webapi/**'],
              message:
                'Files in core/service/keyring can only import from background/webapi/* or within core',
            },
            // Block imports from core/* except core/utils and core/service
            {
              group: [
                'core/*',
                '!core/utils',
                '!core/utils/**',
                '!core/service',
                '!core/service/**',
              ],
              message:
                'Files in core/service/keyring can only import from core/utils/* or within service',
            },
            // Block UI imports
            {
              group: ['ui/*', 'ui/**'],
              message: 'Files in core/service/keyring cannot import from UI',
            },
            // Allow relative imports to utils and webapi from keyring folder
            {
              group: [
                '../../*',
                '!../../utils',
                '!../../utils/**',
                '!../../../background/webapi',
                '!../../../background/webapi/**',
              ],
              message:
                'Files in core/service/keyring can only import from ../../utils/* or ../../../background/webapi/*',
            },
            // Block ALL relative imports to shared - force use of @/shared alias
            {
              group: [
                '../shared/**',
                '../../shared/**',
                '../../../shared/**',
                '../../../../shared/**',
              ],
              message: 'Use @/shared/* alias instead of relative imports to shared',
            },
          ],
        },
      ],
    },
  }, // UI-specific config to block relative imports outside ui folder
  {
    files: ['**/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Block relative imports that explicitly go to background or shared
            {
              group: [
                '../background/*',
                '../background/**',
                '../**/background/**',
                '../**/shared/*',
                '../shared/*',
                '../**/shared/**',
              ],
              message:
                'Files in UI folder must use aliases (@/shared/*, @/background/*) instead of relative paths',
            },
            // Block relative imports to src level that aren't ui
            {
              group: [
                '**/src/background/*',
                '**/src/background/**',
                '**/src/shared/*',
                '**/packages/shared/src/**',
                '**/src/content-script/*',
                '**/src/content-script/**',
                '**/src/core/*',
                '**/packages/core/src/**',
              ],
              message: 'Files in UI folder must use aliases for imports outside UI',
            },
            // Block core imports from UI
            {
              group: [
                '@/core/*',
                '@/core/**',
                '../core/*',
                '../core/**',
                '../../core/*',
                '../../core/**',
              ],
              message: 'Files in UI folder cannot import from core',
            },
            // Block relative imports between UI subfolders (force use of aliases)
            {
              group: [
                '../components/*',
                '../components/**',
                '../views/*',
                '../views/**',
                '../hooks/*',
                '../hooks/**',
                '../utils/*',
                '../utils/**',
                '../reducers/*',
                '../reducers/**',
                '../style/*',
                '../style/**',
                '../assets/*',
                '../assets/**',
                '../../components/*',
                '../../components/**',
                '../../views/*',
                '../../views/**',
                '../../hooks/*',
                '../../hooks/**',
                '../../utils/*',
                '../../utils/**',
                '../../reducers/*',
                '../../reducers/**',
                '../../style/*',
                '../../style/**',
                '../../assets/*',
                '../../assets/**',
              ],
              message:
                'Files in UI subfolders must use aliases (@/ui/*) instead of relative paths to other UI subfolders',
            },
          ],
        },
      ],
    },
  },
  // Shared folder cannot import outside of shared
  {
    files: ['**/packages/shared/src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Block relative imports outside shared folder
            {
              group: [
                '../background/*',
                '../background/**',
                '../ui/*',
                '../ui/**',
                '../content-script/*',
                '../content-script/**',
                '../../background/*',
                '../../background/**',
                '../../ui/*',
                '../../ui/**',
                '../../content-script/*',
                '../../content-script/**',
              ],
              message: 'Files in shared folder cannot import outside of shared folder',
            },
            // Block alias imports outside shared
            {
              group: [
                '@/background/*',
                '@/background/**',
                '@/ui/*',
                '@/ui/**',
                '@/content-script/*',
                '@/content-script/**',
              ],
              message: 'Files in shared folder cannot import outside of shared folder',
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
];

export default config;
