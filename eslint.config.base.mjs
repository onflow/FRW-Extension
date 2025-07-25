import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

export const baseConfig = {
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
      typescript: {
        alwaysTryTypes: true,
      },
      node: true,
    },
    'import/extensions': ['.ts', '.tsx', '.js', '.jsx', '.json'],
    react: {
      version: 'detect',
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
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [
          {
            pattern: '@onflow/frw-*/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '@/**',
            group: 'internal',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
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
};

export const testConfig = {
  rules: {
    'no-restricted-globals': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': ['off'],
    'no-restricted-imports': 'off', // Tests can import anything they need to test
  },
};

export const buildConfig = {
  rules: {
    'no-console': ['off'],
  },
};
