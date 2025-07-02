import { type CacheDataItem } from '@/shared/types/data-cache-types';
import { consoleError } from '@/shared/utils/console-log';
import storage from '@/shared/utils/storage';

/**
 * Get valid data from session storage
 * This will return the data if it exists and is not expired
 * It will NOT trigger a background event to refresh the data
 * This is useful if you need to get the data without triggering a refresh
 * @param key - The key to get the data from
 * @returns The cached data or undefined if it doesn't exist or is expired
 */

export const getValidData = async <T>(key: string): Promise<T | undefined> => {
  const sessionData: CacheDataItem | undefined = await storage.getSession(key);
  if (!sessionData || sessionData.expiry < Date.now()) {
    return undefined;
  }
  return sessionData?.value as T | undefined;
};
/**
 * Get whatever data is in session storage - valid or invalid
 * This is rarely used but can be useful if you need to get something from the cache whilst doing a refresh
 * @param key - The key to get the data from
 * @returns The cached data or undefined if it doesn't exist or is expired
 */

export const getInvalidData = async <T>(key: string): Promise<T | undefined> => {
  const sessionData: CacheDataItem | undefined = await storage.getSession(key);

  return sessionData?.value as T | undefined;
};

export * from '@/shared/utils/cache-data-access';
/**
 * BACKGROUND ONLY METHODS
 */

/**
 * Listen for a refresh event from the background script
 * @param key - The key to listen for
 * @param refreshCallback - The background callback that will update the data in the session storage
 */
export const registerRefreshListener = (
  keyRegex: RegExp,
  loader: (...args: string[]) => Promise<unknown>
) => {
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    // Filter out timestamp changes
    const changedKeys = Object.keys(changes).filter((key) => key.includes('-refresh'));
    if (changedKeys.length === 0) {
      return;
    }
    const key = changedKeys.find((key) => keyRegex.test(key));
    if (namespace === 'session' && key) {
      // Check that the old value is undefined, and the new value is a number
      // If the refresh key is already set, then we might be in the middle of a refesh already
      // If we are setting the refresh key to undefined (i.e. removing it), then we have just finished a refresh
      if (changes[key].oldValue === undefined && typeof changes[key].newValue === 'number') {
        const matchedArgs = key.match(keyRegex) ?? [];
        // Remove the first argument (the whole key)
        const [, ...args] = matchedArgs;
        try {
          await loader(...args);
        } catch (error) {
          consoleError('Error refreshing data', key, args, error);
        }
      }

      // Remove the refresh key
      await storage.removeSession(`${key}`);
    }
  });
};

/**
 * BACKGROUND ONLY METHODS
 */

/**
 * Set the cached data in the session storage
 * @param key - The key to set the data for
 * @param value - The value to set the data to
 * @param ttl - The time to live for the data
 */
export const setCachedData = async (
  key: string,
  value: unknown,
  ttl: number = 30_000 // 30 seconds by default
): Promise<void> => {
  // Check that the key is not already set
  const newCacheData: CacheDataItem = { value, expiry: Date.now() + ttl };
  return storage.setSession(key, newCacheData).then(() => {
    // Remove any refresh key if it exists as the data has just been updated
    storage.removeSession(`${key}-refresh`);
  });
};

export const clearCachedData = async (key: string): Promise<void> => {
  return storage.removeSession(key);
};

// Export batch refresh functionality
export { registerBatchRefreshListener } from './batch-refresh';
