import type { StorageInterface, StorageChange } from '@frw/storage-adapters';

export interface CacheDataItem<T = unknown> {
  value: T;
  expiry: number;
}

export interface CacheManagerOptions {
  defaultTTL?: number;
  storage: StorageInterface;
}

export class CacheManager {
  private storage: StorageInterface;
  private defaultTTL: number;
  private listeners: Map<string, Set<(key: string, data: unknown) => void>> = new Map();

  constructor(options: CacheManagerOptions) {
    this.storage = options.storage;
    this.defaultTTL = options.defaultTTL || 30000; // 30 seconds default
    
    // Set up storage change listener
    if (this.storage.onChanged) {
      this.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    }
  }

  /**
   * Get cached data from session storage
   * This will then trigger a background event to refresh the data if it is expired
   * The frontend should be listening for changes to this data and then re-fetching it when it changes
   * @param key - The key to get the data from
   * @returns The cached data or undefined if it doesn't exist or is expired
   */
  async getCachedData<T>(key: string): Promise<T | undefined> {
    const result = await this.storage.session.get(key);
    const sessionData = result[key] as CacheDataItem<T> | undefined;
    
    if (!sessionData || sessionData.expiry < Date.now()) {
      // Data is not there or expired, trigger a background event to refresh the data
      // We do this by setting a key in session storage that the background script will pick up
      await this.storage.session.set({ [`${key}-refresh`]: Date.now() });
    }
    
    return sessionData?.value as T | undefined;
  }

  /**
   * Set cached data in session storage
   * @param key - The key to store the data under
   * @param value - The value to store
   * @param ttl - Time to live in milliseconds (optional)
   */
  async setCachedData<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiryTime = Date.now() + (ttl || this.defaultTTL);
    const cacheItem: CacheDataItem<T> = {
      value,
      expiry: expiryTime
    };
    
    await this.storage.session.set({ [key]: cacheItem });
  }

  /**
   * Trigger a refresh of the data for a given key
   * Should rarely be used!!
   * @param key - The key to trigger a refresh for
   */
  async triggerRefresh(key: string): Promise<void> {
    await this.storage.session.set({ [`${key}-refresh`]: Date.now() });
  }

  /**
   * Clear cached data for a specific key
   * @param key - The key to clear
   */
  async clearCachedData(key: string): Promise<void> {
    await this.storage.session.remove(key);
  }

  /**
   * Clear all cached data
   */
  async clearAllCachedData(): Promise<void> {
    await this.storage.session.clear();
  }

  /**
   * Add a listener for changes to a specific key
   * @param key - The key to listen for changes on
   * @param callback - The callback to call when the data changes
   */
  addUpdateListener(key: string, callback: (key: string, data: unknown) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  /**
   * Remove a listener for changes to a specific key
   * @param key - The key to stop listening for changes on
   * @param callback - The callback to remove
   */
  removeUpdateListener(key: string, callback: (key: string, data: unknown) => void): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.delete(callback);
      if (keyListeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Handle storage changes
   */
  private handleStorageChange(changes: { [key: string]: StorageChange }, areaName: string): void {
    if (areaName !== 'session') return;

    // Check each changed key against our listeners
    for (const [changedKey, change] of Object.entries(changes)) {
      if (change.newValue && !changedKey.endsWith('-refresh')) {
        const listeners = this.listeners.get(changedKey);
        if (listeners) {
          try {
            const cacheData = change.newValue as CacheDataItem;
            listeners.forEach(callback => {
              try {
                callback(changedKey, cacheData.value);
              } catch (error) {
                console.error('Error in cache update listener:', error);
              }
            });
          } catch (error) {
            console.error('Error processing cache update:', changedKey, error);
          }
        }
      }
    }
  }

  /**
   * Destroy the cache manager and clean up listeners
   */
  destroy(): void {
    if (this.storage.onChanged) {
      this.storage.onChanged.removeListener(this.handleStorageChange.bind(this));
    }
    this.listeners.clear();
  }
}