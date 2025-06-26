# Cache Data Model Architecture

## Overview

The caching system is built specifically for Chrome extensions, implementing a stale-while-revalidate pattern adapted for the unique constraints of extension architecture. Normal react based caching strategies don't work as the react application is destroyed each time the popup is closed.

The system handles two types of storage:

1. **Session Storage (Cache Data)**: For temporary, refreshable data that needs to be synchronized between the background service worker and UI
2. **Local Storage (User Data)**: For persistent user preferences and settings

## Core Components

### 1. Data Structure

The basic cache data structure is defined in `data-cache-types.ts`:

```typescript
type CacheDataItem = {
  value: unknown;
  expiry: number;
};
```

### 2. Storage Pattern

The system uses three main patterns:

#### A. Key Management

- Defined in `cache-data-keys.ts` and `user-data-keys.ts`
- Each data type has a unique key generator function
- Keys often include parameters like network, address, or user ID
- Includes TypeScript types for the stored data

#### B. Background Service Worker

- Handles data fetching and refreshing
- Data in the cache is **only ever set in the background**
- Uses Chrome's storage API to communicate with the UI
- Implements refresh listeners for automatic data updates

#### C. Frontend Hooks

- React hooks that subscribe to storage changes
- Automatically trigger refreshes when data is stale
- Handle component lifecycle and cleanup

## How It Works

### 1. Data Flow

1. UI requests data using `getCachedData`
2. If data is expired/missing, triggers refresh by setting a `-refresh` key
3. Background worker detects refresh key and fetches new data
4. New data is stored in session storage
5. UI components receive updates via storage listeners

### 2. Creating New Cached Data

Here's how to implement a new cached data type:

1. **Define Keys** (in `cache-data-keys.ts`):

```typescript
export const newDataKey = (param1: string, param2: string) => `new-data-${param1}-${param2}`;
export const newDataRefreshRegex = refreshKey(newDataKey);
export type NewDataStore = YourDataType;

export const getCachedNewData = async (param1: string, param2: string) => {
  return getCachedData<NewDataStore>(newDataKey(param1, param2));
};
```

2. **Create Background Loader** (in your background service):

- The loaders should always call `setCachedData`.
- They should return the data as a promise.
- They should throw an error if the data is not loadable
- The arguments to the loader must be completely embedded in the key
- Loaders should not rely on any global or state - they should only use the arguments passed. e.g. never call anything in a loader to get the current state of something that is then used to load data.

```typescript
import { registerRefreshListener } from '@/background/utils/data-cache';

const loadYourData = async (param1: string, param2: string): Promise<SomeData> => {
  const data = await fetchSomeData(param1, param2);
  await setCachedData(newDataKey(param1, param2), data);
};
const initService = () => {
  registerRefreshListener(newDataRefreshRegex, loadYourData);
};
```

3. **Create Background Accessor** _(Optional)_

Accessing cached data in the background has to be handled a little differently to the frontend. The frontend automatically refreshes and handles loading state. The background does not - it needs to be able to get and refresh data in a single async call.

The background accesses the cached data without triggering a refresh, then call the loader directly if the data is undefined or expired. Call the special function `getValidData` to return either the data or undefined if the data is no longer valid.

Call these accessors _only_ in the background. Do not call from the front end through a proxy.

```typescript
getYourData = async (param1: string, param2: string): Promise<SomeData> => {
  const myData = await getValidData<SomeData>(newDataKey(param1, param2));
  if (!myData) {
    // Data has expired or hasn't loaded
    return loadYourData(param1, param2);
  }
  return myData;
};
```

4. **Create Frontend Hook** (in your component):

- Accessing data from the front end is simple. Just read the storage cache.
- Reading the cache will always return what is there - even if the data is old
- If the data is old a refresh is automatically triggered in the background
- The hook includes a listener that will update react state when the cache updates which will update the UI
- Note that `undefined` means loading. The frontend must expect data to be undefined when first loading

```typescript
const data = useCachedData<NewDataStore>(newDataKey(param1, param2));
```

### 3. Creating New User Data

For persistent user preferences:

1. **Define Keys** (in `user-data-keys.ts`):

```typescript
export const newUserDataKey = 'new-user-data';
export type NewUserDataStore = YourDataType;

export const getNewUserData = async () => {
  return getUserData<NewUserDataStore>(newUserDataKey);
};
```

2. **Use in Components**:

```typescript
const userData = useUserData<NewUserDataStore>(newUserDataKey);
```

## Batch Refresh Mechanism

For data that might be requested multiple times in quick succession (like account balances when displaying a list of accounts), we provide a batch refresh mechanism that collects multiple refresh requests and processes them together.

### When to Use Batch Refresh

Use batch refresh when:

- Multiple UI components might request the same type of data simultaneously
- The backend API supports batch operations (e.g., fetching multiple account balances at once)
- You want to reduce the number of API calls to avoid rate limiting or improve performance

### How to Implement Batch Refresh

1. **Use `registerBatchRefreshListener` instead of `registerRefreshListener`**:

```typescript
import { registerBatchRefreshListener } from '@/background/utils/data-cache';

registerBatchRefreshListener(
  accountBalanceRefreshRegex,
  async (network: string, addresses: string[]) => {
    // Load data for all addresses in one API call
    const balances = await loadAccountListBalance(network, addresses);

    // Return a record keyed by the batch key (address)
    const result: Record<string, string> = {};
    addresses.forEach((address, index) => {
      result[address] = balances[index] || '0.00000000';
    });
    return result;
  },
  (matches) => matches[2], // Extract batch key (address) from regex matches
  (network: string, address: string) => accountBalanceKey(network, address),
  100 // Batch window in milliseconds
);
```

2. **Parameters Explained**:

   - `keyRegex`: The refresh key regex pattern (must include `-refresh` suffix)
   - `batchLoader`: Function that loads data for multiple items at once
   - `getBatchKey`: Function to extract the batch key from regex matches
   - `getFullKey`: Function to reconstruct the full cache key
   - `batchWindowMs`: Time to wait before processing the batch (default: 100ms)
   - `ttl`: Optional time-to-live for cached data

3. **How It Works**:
   - When multiple refresh requests come in within the batch window, they are collected
   - After the batch window expires, all collected requests are processed together
   - Requests are grouped by their first argument (usually network)
   - The batch loader is called once per group with all batch keys
   - Results are distributed to individual cache keys

### Example: Account Balance Batching

Here's how account balance batching is implemented:

```typescript
// In userWallet.ts
registerBatchRefreshListener(
  accountBalanceRefreshRegex,
  async (network: string, addresses: string[]) => {
    // This existing function already supports multiple addresses
    const balances = await loadAccountListBalance(network, addresses);

    // Convert array result to record for batch refresh
    const result: Record<string, string> = {};
    addresses.forEach((address, index) => {
      result[address] = balances[index] || '0.00000000';
    });
    return result;
  },
  (matches) => matches[2], // Extract address from regex
  (network: string, address: string) => accountBalanceKey(network, address),
  100 // 100ms batch window
);
```

This ensures that when the UI displays a list of accounts, all balance requests are batched into a single API call, significantly reducing backend load.

## Efficiency Considerations

1. **Minimal Data Transfer**

- Only transfers changed data between background and UI
- Uses Chrome's built-in storage events for efficient updates

2. **Smart Caching**

- Implements TTL (Time To Live) for cached data
- Stale-while-revalidate pattern prevents unnecessary fetches
- Background updates don't block UI rendering

3. **Type Safety**

- Full TypeScript support for type checking
- Generic types for data store definitions

## Rules & Best Practices

1. **Key Management**

- Use consistent naming patterns for keys
- All arguments needed to refresh the data must be included in the key.
- Ensure the key created does not conflict with other keys - consider how the refresh regex pattern works. Do not re-use the same prefix
- Include version numbers for breaking changes
- Document data types and structures

2. **Refresh Handling**

- Set appropriate TTL values based on data volatility
- Ensure no state is used in loaders. The arguments must be enough
- Implement error handling in background loaders. Throw errors from loaders
- Clean up listeners when components unmount

3. **Data Access**

- Use provided hooks instead of direct storage access on the front end. These listen to storage changes and update automatically
- In the background create a data accessor that directly loads data - but only use these accessors in the background - not through proxies
- If you want to preload data in the background - simply call one of the background data accessors instead of calling the loader. This will use the existing cache but also ensure data is loaded
- Handle undefined/loading states in components. `undefined` means the data is loading `null` means the data has loaded but is null

4. **Data Mutation**

- _Never alter cached data in the foreground_ - call a background function through a proxy
- Background loaders should only update the cache
- If you want to mutate data locally - as some remote operation is pending - then create a second cache. Store the mutated data in memory then save to a combined cache that includes the pending items. Look at the transaction service to see how this is done
