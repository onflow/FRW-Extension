import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import inject from '@rollup/plugin-inject';
import commonjs from '@rollup/plugin-commonjs';
import wasm from 'vite-plugin-wasm';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
const mode = process.env.NODE_ENV || 'development';
const envFile = mode === 'production' ? '.env.pro' : '.env.dev';
dotenv.config({ path: envFile });

// Read package.json for version
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',

  manifest: ({ mode }) => {
    const isDev = mode === 'development';
    const manifestData = JSON.parse(
      fs.readFileSync(
        isDev ? './_raw/manifest/manifest.dev.json' : './_raw/manifest/manifest.pro.json',
        'utf-8'
      )
    );

    return {
      ...manifestData,
      version: pkg.version,
      name: isDev ? 'Flow Wallet - DEV' : 'Flow Wallet',
      oauth2: {
        client_id: process.env.OAUTH2_CLIENT_ID || '',
        scopes: process.env.OAUTH2_SCOPES?.split(',') || [],
      },
      key: isDev ? process.env.MANIFEST_KEY : undefined,
    };
  },

  alias: {
    '@/': path.resolve(__dirname, './src/'),
    '@onflow/flow-wallet-shared': path.resolve(__dirname, '../../packages/shared/src'),
    '@onflow/flow-wallet-reducers': path.resolve(__dirname, '../../packages/ui/src/reducers'),
    moment: 'dayjs',
  },

  vite: () => ({
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      wasm(),
      commonjs({
        include: [/node_modules/],
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto',
      }),
      nodePolyfills({
        include: ['crypto', 'stream', 'os', 'path', 'url', 'https', 'zlib', 'util', 'vm'],
        globals: {
          Buffer: true,
          process: true,
        },
      }),
      inject({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
        dayjs: 'dayjs',
      }),
    ],

    resolve: {
      alias: {
        '@/': path.resolve(__dirname, './src/'),
        '@onflow/flow-wallet-shared': path.resolve(__dirname, '../../packages/shared/src'),
        '@onflow/flow-wallet-reducers': path.resolve(__dirname, '../../packages/ui/src/reducers'),
        moment: 'dayjs',
        process: 'process/browser',
      },
      dedupe: ['react', 'react-dom'],
    },

    build: {
      target: 'esnext',
      sourcemap: mode === 'development' ? 'inline' : false,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },

    optimizeDeps: {
      exclude: ['@trustwallet/wallet-core'],
      include: [
        'dayjs',
        'buffer',
        'process',
        'process/browser',
        'react',
        'react-dom',
        'react-router',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },

    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.version': JSON.stringify(pkg.version),
      'process.env.release': JSON.stringify(pkg.version),
      'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV || mode),
      'process.env.DEPLOYMENT_ENV': JSON.stringify(process.env.DEPLOYMENT_ENV || mode),
      'process.env.IS_BETA': JSON.stringify(process.env.IS_BETA || 'false'),
      // Add Firebase config
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        process.env.FIREBASE_MESSAGING_SENDER_ID
      ),
      'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID),
      // Add other env variables
      'process.env.REOWN_WALLET_PROJECT_ID': JSON.stringify(process.env.REOWN_WALLET_PROJECT_ID),
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
      'process.env.DEV_PASSWORD': JSON.stringify(process.env.DEV_PASSWORD),
    },

    server: {
      port: 3000,
      hmr: {
        overlay: true,
      },
    },
  }),

  webExt: {
    startUrls: mode === 'development' ? ['https://localhost:3000'] : undefined,
  },

  hooks: {
    'build:manifestGenerated': async (_wxt, manifest) => {
      // Add any additional manifest modifications here
      // Log manifest version during build
    },

    'build:before': async (wxt) => {
      // Copy static assets
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Copy locales
      const localesSource = path.resolve(__dirname, '_raw/_locales');
      const localesDest = path.resolve(publicDir, '_locales');
      if (fs.existsSync(localesSource) && !fs.existsSync(localesDest)) {
        fs.cpSync(localesSource, localesDest, { recursive: true });
      }

      // Copy images
      const imagesSource = path.resolve(__dirname, '_raw/images');
      const imagesDest = path.resolve(publicDir, 'images');
      if (fs.existsSync(imagesSource) && !fs.existsSync(imagesDest)) {
        fs.cpSync(imagesSource, imagesDest, { recursive: true });
      }

      // Copy WASM file
      const wasmSource = path.resolve(
        __dirname,
        'node_modules/@trustwallet/wallet-core/dist/lib/wallet-core.wasm'
      );
      const wasmDest = path.resolve(publicDir, 'wallet-core.wasm');
      if (fs.existsSync(wasmSource) && !fs.existsSync(wasmDest)) {
        fs.copyFileSync(wasmSource, wasmDest);
      }

      // Copy script.js
      const scriptSource = path.resolve(__dirname, 'src/content-script/script.js');
      const scriptDest = path.resolve(publicDir, 'script.js');
      if (fs.existsSync(scriptSource) && !fs.existsSync(scriptDest)) {
        fs.copyFileSync(scriptSource, scriptDest);
      }

      // Handle React DevTools for development
      if (wxt.config.mode === 'development') {
        try {
          const response = await fetch('http://localhost:8097');
          const devToolsScript = await response.text();
          fs.writeFileSync(path.resolve(publicDir, 'react-devtools.js'), devToolsScript);
          // React DevTools fetched successfully
        } catch (e) {
          // React DevTools not available
        }
      }
    },
  },
});
