# Flow Reference Wallet - Webpack to WXT Migration Plan

## Overview

This document outlines a comprehensive plan to migrate the Flow Reference Wallet Chrome Extension from webpack to Vite using the WXT framework.

## Migration Goals

- Replace webpack with Vite for faster builds and better DX
- Leverage WXT's convention-based approach for browser extensions
- Maintain all existing functionality
- Improve build times and development experience
- Enable easier multi-browser support

## Phase 1: Setup and Preparation (Days 1-2)

### 1.1 Create Feature Branch

```bash
git checkout -b migrate-to-wxt
```

### 1.2 Install WXT and Dependencies

```bash
# Remove webpack dependencies
pnpm remove webpack webpack-cli webpack-dev-server webpack-merge \
  html-webpack-plugin copy-webpack-plugin dotenv-webpack \
  ts-loader css-loader style-loader url-loader file-loader \
  @svgr/webpack

# Install WXT and Vite
pnpm add -D wxt vite @vitejs/plugin-react
pnpm add -D @rollup/plugin-inject @rollup/plugin-wasm
pnpm add -D vite-plugin-node-polyfills
```

### 1.3 Initialize WXT Configuration

Create `wxt.config.ts`:

```typescript
import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',

  manifest: ({ mode }) => ({
    name: mode === 'production' ? 'Flow Wallet' : 'Flow Wallet - DEV',
    version: pkg.version,
    permissions: ['storage', 'tabs', 'contextMenus', 'notifications', 'alarms'],
    // OAuth2 config will be added based on environment
  }),

  vite: () => ({
    plugins: [
      react(),
      nodePolyfills({
        include: ['crypto', 'stream', 'os', 'path', 'url', 'https', 'zlib', 'util'],
        globals: {
          Buffer: true,
          process: true,
        },
      }),
      inject({
        Buffer: ['buffer', 'Buffer'],
        process: 'process',
        dayjs: 'dayjs',
      }),
    ],
    resolve: {
      alias: {
        '@/': path.resolve(__dirname, './src/'),
        '@onflow/flow-wallet-shared': path.resolve(__dirname, '../../packages/shared/src'),
        '@onflow/flow-wallet-reducers': path.resolve(__dirname, '../../packages/ui/src/reducers'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  }),
});
```

### 1.4 Create Migration Testing Checklist

- [ ] All entry points load correctly
- [ ] Background service worker functions
- [ ] Content scripts inject properly
- [ ] Popup UI renders
- [ ] WebAssembly loads
- [ ] Environment variables work
- [ ] Development mode features (HMR, DevTools)
- [ ] Production build optimization
- [ ] Extension manifest is correct

## Phase 2: Entry Points Migration (Days 3-4)

### 2.1 Create WXT Directory Structure

```
src/
├── entrypoints/
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   └── index.ts
│   ├── popup/
│   │   ├── index.html
│   │   └── main.tsx
│   └── content-eth-provider.ts
├── assets/
├── components/
├── utils/
└── app.config.ts
```

### 2.2 Migrate Background Script

Move `src/background/index.ts` to `src/entrypoints/background/index.ts`:

```typescript
import { defineBackground } from 'wxt/browser';

export default defineBackground({
  type: 'module',
  persistent: false,

  main() {
    // Existing background code
    import('../../background/controller/wallet').then(({ default: wallet }) => {
      // Initialize wallet
    });
  },
});
```

### 2.3 Migrate Content Scripts

Create `src/entrypoints/content/index.ts`:

```typescript
import { defineContentScript } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: true,

  main(ctx) {
    // Import and initialize content script
    import('../../content-script').then((module) => {
      // Initialize
    });
  },
});
```

### 2.4 Migrate Ethereum Provider

Create `src/entrypoints/content-eth-provider.ts`:

```typescript
import { defineContentScript } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',

  main() {
    // Ethereum provider injection code
  },
});
```

### 2.5 Migrate Popup UI

Create `src/entrypoints/popup/index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flow Wallet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

Create `src/entrypoints/popup/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../ui/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Phase 3: Assets and Static Files (Day 5)

### 3.1 Move Static Assets

```bash
# Create public directory structure
mkdir -p public/_locales
mkdir -p public/fonts
mkdir -p public/images

# Move assets
mv _raw/_locales/* public/_locales/
mv _raw/fonts/* public/fonts/
mv _raw/images/* public/images/
mv build/wallet-core.wasm public/
mv src/content-script/script.js public/
```

### 3.2 Update Asset References

- Update all asset imports to use proper paths
- Configure public assets in `wxt.config.ts`

## Phase 4: Environment and Build Configuration (Days 6-7)

### 4.1 Create Environment Files

`.env.development`:

```env
# Copy from .env.dev
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
# etc.
```

`.env.production`:

```env
# Copy from .env.pro
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### 4.2 Update Build Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "build:edge": "wxt build -b edge",
    "zip": "wxt zip",
    "postinstall": "wxt prepare",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### 4.3 Implement Custom Build Hooks

Add to `wxt.config.ts`:

```typescript
hooks: {
  'build:manifestGenerated': async (wxt, manifest) => {
    // Add OAuth2 configuration
    if (wxt.config.mode === 'development') {
      manifest.oauth2 = {
        client_id: process.env.PUBLIC_FIREBASE_CLIENT_ID,
        scopes: ['openid', 'email', 'profile']
      };
      manifest.key = 'MIIBIjANBgkqh...'; // Dev key
    }
  },

  'build:before': async () => {
    // Fetch React DevTools if needed
    if (process.env.NODE_ENV === 'development') {
      // Implementation
    }
  }
}
```

## Phase 5: Testing and Validation (Days 8-9)

### 5.1 Unit Test Migration

- Update test configuration for Vite
- Ensure all existing tests pass
- Add tests for new build configuration

### 5.2 E2E Test Updates

- Update Playwright configuration
- Test extension loading with new build output
- Verify all user flows work correctly

### 5.3 Performance Testing

- Compare build times (webpack vs WXT)
- Test HMR performance
- Measure bundle sizes

### 5.4 Cross-Browser Testing

- Test Chrome build
- Test Firefox build (new capability!)
- Test Edge build (if applicable)

## Phase 6: Cleanup and Documentation (Day 10)

### 6.1 Remove Webpack Files

```bash
rm webpack.config.ts
rm -rf build/webpack.*
rm build/prepareManifest.ts
rm webpack-cli-wrapper.cjs
```

### 6.2 Update Documentation

- Update README.md with new build commands
- Update CLAUDE.md with WXT-specific information
- Document new development workflow

### 6.3 Update CI/CD

- Update GitHub Actions workflows
- Update build commands in CI
- Ensure automated testing works

## Rollback Plan

If critical issues arise:

1. Keep webpack configuration in a separate branch
2. Document any data migrations needed
3. Have a quick rollback procedure ready

## Success Metrics

- [ ] Build time reduced by >50%
- [ ] HMR working for all entry points
- [ ] All existing features working
- [ ] Successfully builds for multiple browsers
- [ ] Developer feedback positive

## Risk Mitigation

### High-Risk Areas

1. **WebAssembly Loading**: Test thoroughly, may need custom solution
2. **Firebase Auth**: Ensure web-extension package works with Vite
3. **Chrome Storage**: Verify all storage operations work correctly
4. **Extension Manifest**: Double-check all permissions and configurations

### Mitigation Strategies

- Incremental migration with feature flags
- Extensive testing at each phase
- Keep webpack build as backup
- Regular commits for easy rollback

## Timeline

- **Week 1**: Phases 1-3 (Setup, Entry Points, Assets)
- **Week 2**: Phases 4-6 (Configuration, Testing, Cleanup)
- **Buffer**: 3 days for unexpected issues

## Post-Migration Improvements

Once migration is complete:

1. Optimize bundle sizes with Vite's build analysis
2. Implement code splitting for better performance
3. Add support for more browsers
4. Improve development workflow with WXT features
5. Explore WXT modules for additional functionality

## Conclusion

This migration will modernize the build system, improve developer experience, and enable easier multi-browser support. The phased approach minimizes risk while ensuring all functionality is preserved.
