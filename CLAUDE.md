# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flow Reference Wallet (FRW) is a Chrome extension that serves as a digital wallet for the Flow blockchain. It's built using TypeScript, React, and Material-UI (MUI v7), with a background service worker architecture for secure blockchain interactions.

The project is organized as a **pnpm monorepo** with the following structure:

- `apps/extension/` - The main Chrome extension application
- `packages/shared/` - Shared types, constants, and utilities (`@onflow/frw-shared`)
- `packages/reducers/` - State management reducers (`@onflow/frw-reducers`)

## Development Commands

### Build Commands

All commands use pnpm workspace filters and run from the root directory:

- **Development**: `pnpm dev` - Runs `pnpm -F frw-extension build:dev` (file watching enabled)
- **Development (Windows)**: `pnpm winDev` - Windows-specific development build
- **Production**: `pnpm build` - Production build (`pnpm -F frw-extension build:pro`)
- **Test Build**: Extension-specific test build: `cd apps/extension && pnpm build:test`

Note: The extension-specific commands are still available in `apps/extension/` directory:

- `pnpm build:dev` (Mac/Linux) or `pnpm winBuild:dev` (Windows)
- `pnpm build:dev-ci` - CI build without watch mode
- `pnpm build:pro` - Production build
- `pnpm build:test` - Test build

### Testing & Quality

- **Unit Tests**: `pnpm test` - Runs tests across all workspaces
- **Test Coverage**: `pnpm test:unit:coverage` - Coverage report (extension-specific)
- **E2E Tests**: `pnpm test:e2e` - Playwright tests (extension-specific)
- **Linting**: `pnpm lint` - Lints root and all workspaces
- **Linting Fix**: `pnpm lint:fix` - Auto-fix linting issues
- **Format**: `pnpm format:fix` - Format code with Prettier across all workspaces

### Development Tools

- **React DevTools**: `cd apps/extension && pnpm react-devtools` - Run before build to include React DevTools
- **Storybook**: `cd apps/extension && pnpm storybook` - Component development environment

## Architecture Overview

### Monorepo Structure

```
/
├── apps/
│   └── extension/          # Main Chrome extension application
│       ├── src/
│       │   ├── background/     # Service worker
│       │   ├── core/          # Core business logic
│       │   ├── ui/            # React UI
│       │   └── content-script/ # Web page integration
│       ├── _raw/              # Extension static files
│       └── build/             # Build configuration
├── packages/
│   ├── shared/            # @onflow/frw-shared
│   │   ├── src/
│   │   │   ├── types/     # TypeScript type definitions
│   │   │   ├── constant/  # Shared constants
│   │   │   └── utils/     # Utility functions
│   │   └── package.json
│   └── reducers/          # @onflow/frw-reducers
│       ├── src/           # State reducers
│       └── package.json
└── pnpm-workspace.yaml    # Workspace configuration
```

### Core Structure

The extension (in `apps/extension/`) follows a strict separation of concerns:

1. **Background Service Worker** (`apps/extension/src/background/`)
   - Handles all blockchain interactions, key management, and secure operations
   - Cannot access DOM or window objects
   - Communicates via Chrome runtime messaging
   - Main controller: `apps/extension/src/background/controller/wallet.ts`

2. **Core Layer** (`apps/extension/src/core/`)
   - Core business logic and services
   - Wallet services, blockchain interactions
   - Isolated from UI and background specifics

3. **UI Layer** (`apps/extension/src/ui/`)
   - React-based popup interface
   - Communicates with background via `WalletController` proxy
   - Uses MUI v7 for component library
   - Routing with React Router v5

4. **Content Scripts** (`apps/extension/src/content-script/`)
   - Injects wallet provider into web pages
   - Handles dApp communication
   - Implements Flow FCL and Ethereum provider interfaces

5. **Shared Package** (`packages/shared/`)
   - Common types, utilities, and constants
   - Published as `@onflow/frw-shared`
   - Used across all packages and apps

6. **Reducers Package** (`packages/reducers/`)
   - State management reducers
   - Published as `@onflow/frw-reducers`
   - Pure functions for predictable state management

### State Management

- Background service maintains authoritative wallet state
- UI uses React hooks and local state for display
- No global state management library (no Redux/MobX)
- Critical data stored in Chrome storage API

## Environment Setup

1. **Prerequisites**:
   - Node.js >= 22.11.0
   - pnpm >= 9.0.0 (enforced version: 10.12.4)
   - Install dependencies: `pnpm install` (from root)

2. **Required Environment Variables** (in `apps/extension/.env.dev`):
   - Firebase configuration keys
   - API endpoints
   - Feature flags
   - `DEV_PASSWORD` (optional, for development convenience)

3. **Chrome Extension Loading**:
   - Build creates output in `apps/extension/dist/` folder
   - Load unpacked extension from `apps/extension/dist/` in Chrome developer mode
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

1. Define method in `apps/extension/src/background/controller/wallet.ts`
2. Add type definitions in `packages/shared/src/types/`
3. Expose via message handler in background
4. Add proxy method in UI's WalletController

### Import Patterns

```typescript
// Import from shared package
import { SomeType } from '@onflow/frw-shared/types';
import { formatAddress } from '@onflow/frw-shared/utils';

// Import from reducers package
import { accountReducer } from '@onflow/frw-reducers';

// Import within extension (use aliases)
import { WalletController } from '@/background/controller/wallet';
import { Button } from '@/ui/components/Button';
```

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

- Language files in `apps/extension/_raw/_locales/`
- Use `chrome.i18n.getMessage()` for translations
- Keys must not contain spaces and be unique (case-insensitive)

## Workspace Management

### Package Dependencies

- Root workspace manages shared dev dependencies
- Each package has its own dependencies
- Use workspace protocol: `"@onflow/frw-shared": "workspace:*"`

### Common Tasks

```bash
# Install dependencies for all workspaces
pnpm install

# Add dependency to specific workspace
pnpm -F frw-extension add <package-name>
pnpm -F @onflow/frw-shared add <package-name>

# Run command in specific workspace
pnpm -F <workspace-name> <command>

# Build all workspaces
pnpm -r build

# Run tests across all workspaces
pnpm test
```

### Architecture Rules

The project enforces strict architectural boundaries via ESLint:

1. **UI Layer** (`apps/extension/src/ui/`):
   - Cannot import from `@onflow/frw-core/*` or `@/background/*`
   - Must communicate with background via messaging

2. **Core Layer** (`apps/extension/src/core/`):
   - Cannot import from `@/ui/*`
   - Can only import `@/background/webapi/*` from background

3. **Background Layer** (`apps/extension/src/background/`):
   - Cannot import from `@/ui/*`
   - Direct access to core services

4. **Shared Packages**:
   - Must remain pure with no dependencies on app-specific code
   - Reducers can only import from shared package

For detailed architecture documentation, see `docs/architecture-separation.md`

## React Development Guidelines

For React-specific coding standards and best practices, see `docs/react-rules.md`
