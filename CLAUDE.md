# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flow Reference Wallet (FRW) is a Chrome extension that serves as a digital wallet for the Flow blockchain. It's built using TypeScript, React, and Material-UI (MUI v7), with a background service worker architecture for secure blockchain interactions.

## Development Commands

### Build Commands

- **Development**: `pnpm build:dev` (Mac/Linux) or `pnpm winBuild:dev` (Windows) - Builds with file watching and console logging
- **Development CI**: `pnpm build:dev-ci` - Builds without watch mode for CI environments
- **Production**: `pnpm build:pro` - Production build with optimizations
- **Test**: `pnpm build:test` - Test build configuration

### Testing & Quality

- **Unit Tests**: `pnpm test` - Runs tests in watch mode
- **Test Coverage**: `pnpm test:unit:coverage` - Runs tests with coverage report
- **E2E Tests**: `pnpm test:e2e` - Runs Playwright end-to-end tests
- **Linting**: `pnpm lint` - Check code quality
- **Linting Fix**: `pnpm lint:fix` - Auto-fix linting issues
- **Format**: `pnpm format:fix` - Format code with Prettier

### Development Tools

- **React DevTools**: `pnpm react-devtools` - Run before build to include React DevTools
- **Storybook**: `pnpm storybook` - Component development environment

## Architecture Overview

### Core Structure

The extension follows a strict separation of concerns:

1. **Background Service Worker** (`src/background/`)

   - Handles all blockchain interactions, key management, and secure operations
   - Cannot access DOM or window objects
   - Communicates via Chrome runtime messaging
   - Main controller: `src/background/controller/wallet.ts`

2. **UI Layer** (`src/ui/`)

   - React-based popup interface
   - Communicates with background via `WalletController` proxy
   - Uses MUI v7 for component library
   - Routing with React Router v5

3. **Content Scripts** (`src/content-script/`)

   - Injects wallet provider into web pages
   - Handles dApp communication
   - Implements Flow FCL and Ethereum provider interfaces

4. **Shared Code** (`src/shared/`)
   - Common types, utilities, and constants
   - No UI or background-specific dependencies

### State Management

- Background service maintains authoritative wallet state
- UI uses React hooks and local state for display
- No global state management library (no Redux/MobX)
- Critical data stored in Chrome storage API

## Environment Setup

1. **Required Environment Variables** (in `.env.dev`):

   - Firebase configuration keys
   - API endpoints
   - Feature flags
   - `DEV_PASSWORD` (optional, for development convenience)

2. **Chrome Extension Loading**:
   - Build creates output in `dist/` folder
   - Load unpacked extension from `dist/` in Chrome developer mode
   - Enable Developer Mode in extension settings for network switching

## Critical Patterns

### Security Considerations

- Private keys never leave the background service worker
- All signing operations happen in background context
- UI can only request operations, not access sensitive data directly
- Encrypted storage for sensitive information

### Multi-Account Architecture

- Supports multiple Flow accounts per profile
- Each account can have child accounts
- EVM addresses linked to Flow accounts
- Account switching managed by background service

### Network Support

- Flow Mainnet and Testnet
- EVM networks (via linked addresses)
- Network switching requires developer mode enabled

### MUI v7 Migration Notes

- Using standard Grid component (not Grid2)
- Grid API uses `container`, `item`, and breakpoint props
- Styled components from `@mui/material/styles`
- No makeStyles usage (migrated to sx prop)

## Common Development Tasks

### Adding New Wallet Methods

1. Define method in `src/background/controller/wallet.ts`
2. Add type definitions in `src/shared/types/`
3. Expose via message handler in background
4. Add proxy method in UI's WalletController

### Working with Firebase Auth

- Uses Firebase Auth with web-extension package
- Authentication state managed in background
- UI requests auth status via messaging

### Flow Blockchain Integration

- Uses @onflow/fcl for Flow interactions
- Custom transaction building for complex operations
- Account key management for multi-sig support

## Build System

- Webpack 5 with custom configuration
- TypeScript with strict mode
- Environment-specific builds (dev/prod)
- Automatic manifest generation based on environment

## Testing Strategy

- Unit tests with Vitest
- E2E tests with Playwright
- Component testing with Storybook
- Mocking Chrome APIs for testing

## Data Cache Model

The extension implements a sophisticated caching system to optimize API calls and improve performance:

### Cache Architecture

- **Session Storage Based**: Uses Chrome's session storage for temporary data
- **TTL Support**: Each cached item has an expiry timestamp (default 30 seconds)
- **Automatic Refresh**: Expired data triggers background refresh automatically
- **Event-Driven Updates**: UI components receive real-time updates when cache changes

### Key Components

1. **Frontend Access** (`getCachedData`):

   ```typescript
   const data = await getCachedData(key); // Returns cached data or triggers refresh
   ```

2. **Background Registration** (`registerRefreshListener`):

   ```typescript
   registerRefreshListener(keyRegex, async (...args) => {
     const freshData = await fetchFromAPI();
     await setCachedData(key, freshData, ttl);
   });
   ```

3. **Batch Operations** (`registerBatchRefreshListener`):

   - Collects multiple refresh requests within a time window
   - Executes batch API calls for efficiency
   - Used for fetching multiple tokens, NFTs, etc.

4. **React Hooks**:
   - `useCachedData(key)`: Reactive hook for cached data
   - `useUserData(key)`: Hook for persistent user data

### Cache Flow

1. UI requests data via `getCachedData(key)`
2. If expired/missing, sets `${key}-refresh` timestamp
3. Background listener detects refresh request
4. Background fetches fresh data and calls `setCachedData`
5. UI receives update via storage change listener

### Common Cache Keys

- Token prices: `token-price-{address}`
- NFT collections: `nft-collection-{address}`
- User balances: `balance-{userId}-{network}`
- Feature flags: `feature-flags`

## Localization

- Language files in `_raw/_locales/`
- Use `chrome.i18n.getMessage()` for translations
- Keys must not contain spaces and be unique (case-insensitive)
