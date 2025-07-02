export { CacheManager, type CacheDataItem, type CacheManagerOptions } from './cache-manager';

// Re-export cache keys for convenience
export * from './cache-data-keys';

// Export a factory function to create cache managers
export function createCacheManager(storage: import('@frw/storage-adapters').StorageInterface, defaultTTL?: number) {
  return new CacheManager({ storage, defaultTTL });
}