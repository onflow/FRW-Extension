module.exports = {
  extends: [
    '../../eslint.config.mjs'
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // Extension-specific rules can be added here
  },
};