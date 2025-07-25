import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: ['.env.test'] });

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    setupFiles: './vitest.init.ts',
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
