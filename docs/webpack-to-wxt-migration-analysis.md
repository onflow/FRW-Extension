# Webpack to WXT Migration Analysis

## Overview

This document provides a detailed analysis of migrating the Flow Reference Wallet Chrome extension from the current custom webpack build system to WXT framework. Each challenge is analyzed with specific solutions and implementation approaches.

## Migration Challenges and Solutions

### 1. Complex Entry Points Mapping

**Current Setup:**

```javascript
entry: {
  background: 'src/background/index.ts',
  'content-script': 'src/content-script/index.ts',
  pageProvider: 'src/content-script/pageProvider/eth/index.ts',
  ui: 'src/ui/index.tsx',
  script: 'src/content-script/script.js',
}
```

**Challenge:** Multiple entry points with different purposes and contexts.

**WXT Solution:**

- **Background:** Move to `entrypoints/background.ts` with WXT's background API
- **Content Scripts:** Use `entrypoints/content.ts` with WXT's content script configuration
- **Page Provider:** Create a separate content script entry or inject via `public/` assets
- **UI:** Split into `entrypoints/popup.tsx` and `entrypoints/options.tsx`
- **Script:** Move to `public/` directory for direct injection

```typescript
// wxt.config.ts
export default defineConfig({
  entrypoints: {
    popup: 'src/entrypoints/popup.tsx',
    background: 'src/entrypoints/background.ts',
    content: {
      matches: ['<all_urls>'],
      js: ['src/entrypoints/content.ts'],
    },
  },
});
```

### 2. Custom Webpack Plugins

**Current Plugins:**

- CopyPlugin (for wallet-core.wasm, locales, raw files)
- HtmlWebpackPlugin (multiple HTML files)
- DefinePlugin (environment variables)
- ProvidePlugin (global polyfills)

**WXT Solutions:**

**CopyPlugin → WXT Public Assets:**

```typescript
// wxt.config.ts
export default defineConfig({
  publicAssets: [
    {
      from: 'node_modules/@trustwallet/wallet-core/dist/lib/wallet-core.wasm',
      to: 'wallet-core.wasm',
    },
  ],
});
```

**HtmlWebpackPlugin → WXT HTML Templates:**

- WXT automatically generates HTML for popup/options
- For custom HTML (notification.html), use `public/` directory
- Template parameters handled via WXT's HTML template system

**DefinePlugin → WXT Environment Variables:**

```typescript
// wxt.config.ts
export default defineConfig({
  vite: {
    define: {
      'process.env.version': JSON.stringify(version),
      'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV),
    },
  },
});
```

**ProvidePlugin → Vite Plugin:**

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  vite: {
    plugins: [
      inject({
        Buffer: ['buffer', 'Buffer'],
        process: 'process',
        dayjs: 'dayjs',
      }),
    ],
  },
});
```

### 3. Environment-Specific Configurations

**Current Setup:**

- `.env.dev`, `.env.pro`, `.env.test`
- Different webpack configs for each environment
- Build-time environment switching

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  // Use mode-specific config
  runner: {
    startUrls: process.env.NODE_ENV === 'development' ? ['https://localhost:3000'] : undefined,
  },

  // Environment-specific manifest
  manifest: ({ mode }) => ({
    name: mode === 'development' ? 'Flow Wallet Dev' : '__MSG_appName__',
    oauth2: {
      client_id: process.env.OAUTH2_CLIENT_ID,
      scopes: process.env.OAUTH2_SCOPES?.split(','),
    },
  }),
});
```

### 4. Polyfills and Module Fallbacks

**Current Fallbacks:**

```javascript
fallback: {
  http: false,
  https: false,
  stream: 'stream-browserify',
  crypto: 'crypto-browserify',
  os: 'os-browserify/browser',
  path: 'path-browserify',
  buffer: 'buffer',
  url: 'url',
  vm: 'vm-browserify',
}
```

**WXT Solution with Vite:**

```typescript
// wxt.config.ts
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  vite: {
    plugins: [
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'path', 'os'],
        globals: {
          Buffer: true,
          process: true,
        },
      }),
    ],
    resolve: {
      alias: {
        // Disable specific modules
        http: false,
        https: false,
      },
    },
  },
});
```

### 5. Path Aliases and Module Resolution

**Current Aliases:**

```javascript
alias: {
  moment: 'dayjs',
  '@onflow/flow-wallet-shared': paths.rootResolve('../../packages/shared/src'),
  '@onflow/flow-wallet-reducers': paths.rootResolve('../../packages/reducers/src'),
  '@': paths.rootResolve('src'),
}
```

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  alias: {
    '@': path.resolve('src'),
    moment: 'dayjs',
    '@onflow/flow-wallet-shared': path.resolve('../../packages/shared/src'),
    '@onflow/flow-wallet-reducers': path.resolve('../../packages/reducers/src'),
  },
});
```

### 6. WebAssembly Support

**Current Setup:**

```javascript
experiments: {
  asyncWebAssembly: true,
  syncWebAssembly: true,
}
```

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  vite: {
    build: {
      target: 'esnext',
    },
    optimizeDeps: {
      exclude: ['@trustwallet/wallet-core'],
    },
  },
});
```

For WASM files, place in `public/` directory and load via fetch:

```typescript
// utils/loadWasm.ts
export async function loadWalletCore() {
  const wasmModule = await WebAssembly.instantiateStreaming(fetch('/wallet-core.wasm'));
  return wasmModule.instance;
}
```

### 7. React DevTools Integration

**Current Implementation:**

- Fetches DevTools from local server
- Conditionally includes in development builds
- Custom injection logic

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  hooks: {
    'build:before': async ({ mode }) => {
      if (mode === 'development') {
        try {
          const devToolsScript = await fetchDevTools();
          await fs.writeFile('public/react-devtools.js', devToolsScript);
        } catch {
          console.warn('Failed to fetch React DevTools');
        }
      }
    },
  },
});
```

### 8. Custom Manifest Preparation

**Current Process:**

- `prepareManifest.ts` script
- Environment-based manifest selection
- Dynamic version and OAuth configuration

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: ({ mode, env }) => {
    const isDev = mode === 'development';
    const isBeta = env.IS_BETA === 'true';

    return {
      name: isBeta ? '__MSG_appNameBeta__' : '__MSG_appName__',
      version: getVersion(isBeta),
      oauth2: {
        client_id: env.OAUTH2_CLIENT_ID,
        scopes: env.OAUTH2_SCOPES?.split(','),
      },
      key: isDev ? env.MANIFEST_KEY : undefined,
    };
  },
});
```

### 9. Firebase Auth Configuration

**Current Setup:**

- Environment-specific Firebase config
- Loaded via Dotenv webpack plugin

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  // WXT automatically loads .env files

  // Access in code
  vite: {
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
      // ... other Firebase config
    },
  },
});
```

### 10. TypeScript Configuration

**Current Setup:**

- Custom ts-loader configuration
- Different settings for UI entry point
- ts-node for build scripts

**WXT Solution:**

- WXT uses Vite's built-in TypeScript support
- No need for ts-loader configuration
- Faster builds with esbuild

```json
// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["wxt/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 11. Build Output Structure

**Current Output:**

```
dist/
├── background.js
├── content-script.js
├── pageProvider.js
├── ui.js
├── popup.html
├── notification.html
├── index.html
├── _locales/
└── images/
```

**WXT Output:**

```
.output/chrome-mv3/
├── background.js
├── content/
│   └── content-script.js
├── popup.html
├── options.html
├── assets/
├── _locales/
└── public/
```

### 12. Development Features

**Current Features:**

- File watching (`watch: true`)
- Source maps (`devtool: 'inline-cheap-module-source-map'`)
- Filesystem cache
- Custom watch options

**WXT Built-in Features:**

- Automatic HMR for UI
- Auto-reload for background/content scripts
- Better source maps
- Faster rebuilds with Vite

### 13. Production Optimizations

**Current Optimizations:**

- Mode-specific builds
- Asset size limits
- Bundle analysis (commented out)

**WXT Production Features:**

```typescript
// wxt.config.ts
export default defineConfig({
  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'mui-vendor': ['@mui/material'],
          },
        },
      },
    },
  },
});
```

### 14. Custom Build Scripts

**Current Scripts:**

- `webpack-cli-wrapper.cjs` for TypeScript support
- Multiple build commands with different configs
- Cross-platform support (Windows/Mac/Linux)

**WXT Scripts:**

```json
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "compile": "tsc --noEmit"
  }
}
```

### 15. Special Module Handling

**Current Handling:**

- Side effects for pageProvider
- Custom loader rules
- Exclusion patterns for node_modules

**WXT Solution:**

```typescript
// wxt.config.ts
export default defineConfig({
  vite: {
    optimizeDeps: {
      include: ['@onflow/flow-wallet-shared', '@onflow/flow-wallet-reducers'],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/, /packages/],
      },
    },
  },
});
```

## Migration Strategy

### Phase 1: Setup and Basic Migration

1. Install WXT and create initial configuration
2. Move entry points to WXT structure
3. Set up environment variables
4. Configure basic manifest generation

### Phase 2: Asset and Plugin Migration

1. Migrate CopyPlugin patterns to public assets
2. Set up polyfills with Vite plugins
3. Configure path aliases
4. Handle WASM loading

### Phase 3: Development Experience

1. Set up React DevTools integration
2. Configure HMR and auto-reload
3. Migrate development scripts
4. Test development workflow

### Phase 4: Production Build

1. Configure production optimizations
2. Set up build scripts for different environments
3. Migrate CI/CD configurations
4. Test production builds

### Phase 5: Testing and Validation

1. Ensure all features work correctly
2. Validate manifest generation
3. Test in Chrome and Firefox
4. Performance comparison

## Key Benefits of Migration

1. **Simplified Configuration**: Replace 200+ lines of webpack config with concise WXT config
2. **Better Performance**: Vite's faster builds and HMR
3. **Modern Tooling**: ESM-first approach, better TypeScript support
4. **Multi-Browser Support**: Easy Firefox/Edge builds
5. **Better Developer Experience**: Built-in features that currently require custom setup
6. **Maintainability**: Less custom code to maintain

## Potential Risks and Mitigations

1. **WASM Loading**: May need custom solution for wallet-core.wasm
   - Mitigation: Use public assets and runtime loading

2. **Complex Build Logic**: prepareManifest.ts has custom logic
   - Mitigation: Use WXT hooks for build-time operations

3. **Firebase Auth**: Special handling for web extensions
   - Mitigation: Ensure firebase/auth/web-extension works with WXT

4. **Legacy Dependencies**: Some packages might not work with Vite
   - Mitigation: Use compatibility plugins or find alternatives

5. **CI/CD Changes**: Build commands and outputs will change
   - Mitigation: Update CI scripts gradually, test thoroughly
