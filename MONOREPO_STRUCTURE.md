# Monorepo Structure

This repository has been restructured as a monorepo to enable code reuse across different projects. The core wallet functionality has been extracted into reusable packages.

## Repository Structure

```
FRW-Extension3/
├── packages/                    # Reusable packages
│   ├── core/                   # Core wallet services
│   ├── storage-adapters/       # Storage implementations
│   ├── cache/                  # Caching system
│   └── react-hooks/            # React hooks
├── apps/                       # Applications
│   └── extension/              # Chrome extension
├── pnpm-workspace.yaml         # Workspace configuration
└── package.json                # Root package.json
```

## Packages

### @frw/core
- **Purpose**: Core wallet functionality including services, types, and utilities
- **Key Features**:
  - Keyring management (HD wallets, simple keys)
  - Transaction services
  - User and account management
  - NFT and token services
  - Flow blockchain integration
- **Storage**: Uses dependency injection for storage, making it environment-agnostic

### @frw/storage-adapters
- **Purpose**: Storage adapter implementations for different environments
- **Implementations**:
  - `ChromeStorageAdapter`: For Chrome extensions using chrome.storage API
  - `MemoryStorageAdapter`: For testing and in-memory storage
- **Interface**: All adapters implement the `StorageInterface` for consistency

### @frw/cache
- **Purpose**: Caching system with automatic refresh and TTL support
- **Features**:
  - Storage-agnostic (uses storage adapters)
  - Automatic background refresh when data expires
  - Event-driven updates
  - Batch operations support

### @frw/react-hooks
- **Purpose**: React hooks and reducers for wallet UI functionality
- **Includes**:
  - Account management hooks
  - Coin/token data hooks
  - NFT data hooks
  - Feature flag hooks
  - Registration and transaction reducers

## Using the Packages

### In External Projects

```bash
# Install packages
npm install @frw/core @frw/storage-adapters

# Use in your code
import { UserWallet } from '@frw/core';
import { MemoryStorageAdapter } from '@frw/storage-adapters';

const storage = new MemoryStorageAdapter();
const wallet = new UserWallet(storage);
```

### Development Workflow

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build:packages

# Build extension
cd apps/extension
pnpm build:dev

# Run tests
pnpm test:all
```

## Migration Notes

The monorepo migration preserves git history by using `git mv` for all file moves. The core functionality remains the same, but imports have been updated to use the new package structure.

### Key Changes:
1. Services moved from `src/background/service/` to `packages/core/src/services/`
2. Types moved from `src/shared/types/` to `packages/core/src/types/`
3. React hooks moved to `packages/react-hooks/src/hooks/`
4. Cache implementation extracted to `packages/cache/`
5. Storage abstracted to `packages/storage-adapters/`

## Benefits

1. **Code Reuse**: Core wallet functionality can be used in other projects
2. **Better Testing**: Packages can be tested independently with mock storage
3. **Environment Agnostic**: Services work in any JavaScript environment
4. **Clear Dependencies**: Package boundaries make dependencies explicit
5. **Parallel Development**: Teams can work on packages independently