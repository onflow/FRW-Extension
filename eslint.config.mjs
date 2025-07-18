import { baseConfig, buildConfig } from './eslint.config.base.mjs';

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
      'apps/**', // Let each app handle its own linting
    ],
  },
  // JavaScript and TypeScript files in packages
  {
    ...baseConfig,
    files: ['packages/**/*.{js,jsx,ts,tsx}'],
  },
  // Build/config files in root
  {
    ...baseConfig,
    ...buildConfig,
    files: ['*.{js,ts}', 'scripts/**/*.{js,ts}'],
  },
];

export default config;
