import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'import-profile-reducer': 'src/import-profile-reducer.ts',
    'register-reducer': 'src/register-reducer.ts',
    'transaction-reducer': 'src/transaction-reducer.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
