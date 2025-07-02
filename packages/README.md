# Flow Reference Wallet Packages

This monorepo contains reusable packages extracted from the Flow Reference Wallet extension. These packages can be used to build Flow-compatible wallets and applications.

## Available Packages

### @frw/core
Core wallet services including key management, transaction handling, and Flow blockchain interactions.

```typescript
import { HDKeyring, Transaction, UserWallet } from '@frw/core';

// Example: Create a new HD wallet
const keyring = new HDKeyring();
await keyring.generateMnemonic();
const accounts = await keyring.getAccounts();
```

### @frw/storage-adapters
Storage adapters for different environments (Chrome extensions, Node.js, browsers).

```typescript
import { ChromeStorageAdapter, MemoryStorageAdapter } from '@frw/storage-adapters';

// For Chrome extensions
const storage = new ChromeStorageAdapter();

// For testing or Node.js
const storage = new MemoryStorageAdapter();
```

### @frw/cache
Caching system with automatic refresh and expiration.

```typescript
import { CacheManager } from '@frw/cache';
import { MemoryStorageAdapter } from '@frw/storage-adapters';

const cache = new CacheManager({
  storage: new MemoryStorageAdapter(),
  defaultTTL: 30000 // 30 seconds
});

// Cache some data
await cache.setCachedData('user-balance', { amount: 100 }, 60000);

// Retrieve cached data
const balance = await cache.getCachedData('user-balance');
```

### @frw/react-hooks
React hooks for wallet functionality and data fetching.

```typescript
import { useAccount, useCoinList, useNFTs } from '@frw/react-hooks';

function WalletComponent() {
  const account = useAccount();
  const coins = useCoinList();
  const nfts = useNFTs(account?.address);
  
  return (
    <div>
      <h1>Balance: {coins.balance}</h1>
      <h2>NFTs: {nfts.length}</h2>
    </div>
  );
}
```

## Installation

```bash
# Install individual packages
npm install @frw/core @frw/storage-adapters

# Or with pnpm
pnpm add @frw/core @frw/storage-adapters
```

## Example: Building a Simple Flow Wallet

```typescript
import { UserWallet, HDKeyring } from '@frw/core';
import { MemoryStorageAdapter } from '@frw/storage-adapters';
import { CacheManager } from '@frw/cache';

// 1. Set up storage and cache
const storage = new MemoryStorageAdapter();
const cache = new CacheManager({ storage });

// 2. Create wallet instance with dependency injection
const wallet = new UserWallet(storage);

// 3. Create a new wallet
const mnemonic = await wallet.createNewWallet('password123');

// 4. Get account information
const account = await wallet.getMainAccount();
console.log('Flow Address:', account.address);

// 5. Send a transaction
const txId = await wallet.sendTransaction({
  to: '0x123...',
  amount: '10.0',
  token: 'FLOW'
});
```

## Development

Each package has its own build process:

```bash
# Build all packages
pnpm build:packages

# Build individual package
cd packages/core
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm dev
```

## License

MIT