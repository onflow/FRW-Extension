import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import storage from '@/extension-shared/utils/storage';

import { setCachedData } from './data-cache';

type BatchItem = {
  key: string;
  args: string[];
  timestamp: number;
};

type BatchManager = {
  items: Map<string, BatchItem>;
  timeoutId: NodeJS.Timeout | null;
  processing: boolean;
};

// Map to store batch managers for different key patterns
export const batchRefreshManager = new Map<string, BatchManager>();

/**
 * Register a batch refresh listener that collects multiple refresh requests
 * and processes them together in a single batch operation
 *
 * @param keyRegex - Regex pattern to match refresh keys
 * @param batchLoader - Function that loads data for multiple items at once
 * @param getBatchKey - Function to extract the batch key from regex matches
 * @param getFullKey - Function to reconstruct the full cache key
 * @param batchWindowMs - Time window to collect requests before processing (default: 100ms)
 * @param ttl - Time to live for cached data (optional)
 */
export const registerBatchRefreshListener = (
  keyRegex: RegExp,
  batchLoader: (groupKey: string, batchKeys: string[]) => Promise<Record<string, unknown>>,
  getBatchKey: (matches: string[]) => string,
  getFullKey: (...args: string[]) => string,
  batchWindowMs: number = 100,
  ttl?: number
) => {
  const managerId = keyRegex.toString();

  // Initialize batch manager if it doesn't exist
  if (!batchRefreshManager.has(managerId)) {
    batchRefreshManager.set(managerId, {
      items: new Map(),
      timeoutId: null,
      processing: false,
    });
  }

  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    // Filter out non-refresh changes
    const changedKeys = Object.keys(changes).filter((key) => key.includes('-refresh'));
    if (changedKeys.length === 0) {
      return;
    }

    const key = changedKeys.find((key) => keyRegex.test(key));

    if (namespace === 'session' && key) {
      // Check that this is a new refresh request
      if (changes[key].oldValue === undefined && typeof changes[key].newValue === 'number') {
        const matchedArgs = key.match(keyRegex) ?? [];
        const [, ...args] = matchedArgs; // Remove the first argument (the whole key)

        const manager = batchRefreshManager.get(managerId);
        if (!manager) {
          return;
        }

        // Add to batch
        const batchKey = getBatchKey(matchedArgs);
        const batchId = args[0]; // Usually the first arg is the grouping key (e.g., network)
        const itemKey = `${batchId}-${batchKey}`;

        manager.items.set(itemKey, {
          key,
          args,
          timestamp: Date.now(),
        });

        // Clear existing timeout if any
        if (manager.timeoutId) {
          clearTimeout(manager.timeoutId);
        }

        // Set new timeout to process batch
        manager.timeoutId = setTimeout(async () => {
          await processBatch(managerId, batchLoader, getFullKey, ttl);
        }, batchWindowMs);
      }

      // Remove the refresh key
      await storage.removeSession(key);
    }
  });
};

/**
 * Process a batch of refresh requests
 */
async function processBatch(
  managerId: string,
  batchLoader: (groupKey: string, batchKeys: string[]) => Promise<Record<string, unknown>>,
  getFullKey: (...args: string[]) => string,
  ttl?: number
) {
  const manager = batchRefreshManager.get(managerId);
  if (!manager || manager.processing || manager.items.size === 0) {
    return;
  }

  manager.processing = true;
  manager.timeoutId = null;

  try {
    // Group items by their first argument (usually network)
    const groups = new Map<string, BatchItem[]>();

    for (const item of manager.items.values()) {
      const groupKey = item.args[0];
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }

    // Process each group
    for (const [groupKey, items] of groups) {
      try {
        // Extract the batch keys (usually addresses)
        const batchKeys = items.map((item) => item.args[1]);

        // Call batch loader with group key and batch keys
        const results = await batchLoader(groupKey, batchKeys);

        // Distribute results to individual cache keys
        for (const item of items) {
          const batchKey = item.args[1];
          const value = results[batchKey];

          if (value !== undefined) {
            const fullKey = getFullKey(...item.args);
            await setCachedData(fullKey, value, ttl);
          }
        }
      } catch (error) {
        consoleError('Error processing batch', groupKey, error);
      }
    }

    // Clear processed items
    manager.items.clear();
  } finally {
    manager.processing = false;
  }
}
