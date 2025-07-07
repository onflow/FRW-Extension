import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@onflow/flow-wallet-shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@onflow/flow-wallet-shared/': path.resolve(__dirname, '../shared/src/'),
    },
  },
});