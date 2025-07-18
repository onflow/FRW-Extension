import { LRUCache } from 'lru-cache';

import { INTERNAL_REQUEST_ORIGIN } from '@onflow/flow-wallet-shared/constant/domain-constants';
import { MAINNET_CHAIN_ID } from '@onflow/flow-wallet-shared/types/network-types';
import { consoleInfo, consoleWarn } from '@onflow/flow-wallet-shared/utils/console-log';

import { permissionKey, permissionKeyV1 } from '@/data-model/user-data-keys';
import storage from '@/extension-shared/utils/storage'; // Import storage for direct access

import createPersistStore from '../utils/persistStore';

export interface ConnectedSite {
  origin: string;
  icon: string;
  name: string;
  chain?: number;
  e?: number;
  isSigned: boolean;
  isTop: boolean;
  isConnected?: boolean;
  order?: number;
}

interface OldCacheEntry {
  e: number; // Seems to be always 0, likely a legacy field
  k: string; // The key of the cache entry
  v: ConnectedSite; // The value (ConnectedSite object)
}

export type PermissionStore = {
  dumpCache: [string, LRUCache.Entry<ConnectedSite>][]; // New key for the updated LRUCache
};

class PermissionService {
  store: PermissionStore = {
    dumpCache: [],
  };
  lruCache: LRUCache<string, ConnectedSite> | undefined;

  init = async () => {
    // Attempt to load from the new cache key first
    this.store = await createPersistStore<PermissionStore>({
      name: permissionKey, // New storage key
      template: {
        dumpCache: [],
      },
    });

    // If the new cache is empty, try to migrate from the old cache key
    if (!this.store.dumpCache || this.store.dumpCache.length === 0) {
      consoleInfo('New permission cache is empty. Checking for old cache data for migration...');
      const oldStoreData = await storage.get(permissionKeyV1); // Directly get old data from storage

      const migratedEntries: [string, LRUCache.Entry<ConnectedSite>][] = [];

      // Migration logic: Handle the specific old data format: { dumpCache: Array<OldCacheEntry> }
      if (
        oldStoreData &&
        typeof oldStoreData === 'object' &&
        Array.isArray(oldStoreData.dumpCache)
      ) {
        consoleInfo('Attempting migration from old LRUCache dump format (array of {k,v} objects).');
        const oldDumpCache: OldCacheEntry[] = oldStoreData.dumpCache;

        // Iterate through old entries and transform them
        for (const item of oldDumpCache) {
          // Check if item has the expected 'k' and 'v' properties and 'v' is a valid object
          if (
            item &&
            typeof item.k === 'string' &&
            item.v &&
            typeof item.v === 'object' &&
            item.v.origin &&
            item.v.name &&
            item.v.icon
          ) {
            // Use the same TTL as the new cache's default (30 days)
            const ttl = 1000 * 60 * 60 * 24 * 30;
            migratedEntries.push([item.k, { value: item.v, ttl, size: 1 }]);
          } else {
            consoleWarn('Skipping invalid old cache entry during migration:', item);
          }
        }
      } else {
        consoleInfo(
          'No old permission cache data found or it is not in the expected format. Initializing empty cache.'
        );
      }

      // If migration yielded entries, save them to the new key and remove the old one
      if (migratedEntries.length > 0) {
        this.store.dumpCache = migratedEntries; // This will trigger persistStore to save to 'permission_cache_v2'
        consoleInfo('Permission cache migrated successfully. Old cache cleared.');
      }
    }

    // Creating LRU cache with a reasonable size limit
    this.lruCache = new LRUCache<string, ConnectedSite>({
      max: 1000, // Maximum number of items to store
      ttl: 1000 * 60 * 60 * 24 * 30, // 30 days TTL
      maxSize: 1000, // Required when setting 'size' on individual entries
      sizeCalculation: () => 1, // Each entry has size 1
    });

    if (
      this.store.dumpCache &&
      Array.isArray(this.store.dumpCache) &&
      this.store.dumpCache.length > 0
    ) {
      this.lruCache.load(this.store.dumpCache);
    }
  };

  sync = () => {
    if (!this.lruCache) return;
    this.store.dumpCache = this.lruCache.dump();
  };

  getWithoutUpdate = (key: string) => {
    if (!this.lruCache) return;

    return this.lruCache.peek(key);
  };

  addConnectedSite = (
    origin: string,
    name: string,
    icon: string,
    defaultChain = MAINNET_CHAIN_ID,
    isSigned = false
  ) => {
    if (!this.lruCache) return;
    this.lruCache.set(origin, {
      origin,
      name,
      icon,
      chain: defaultChain,
      isSigned,
      isTop: false,
    });
    this.sync();
  };

  touchConnectedSite = (origin: string) => {
    if (!this.lruCache) return;
    if (origin === INTERNAL_REQUEST_ORIGIN) return;
    this.lruCache.get(origin);
    this.sync();
  };

  updateConnectSite = (origin: string, value: Partial<ConnectedSite>, partialUpdate?: boolean) => {
    if (!this.lruCache || !this.lruCache.has(origin)) return;
    if (origin === INTERNAL_REQUEST_ORIGIN) return;

    if (partialUpdate) {
      const _value = this.lruCache.get(origin);
      this.lruCache.set(origin, { ..._value, ...value } as ConnectedSite);
    } else {
      this.lruCache.set(origin, value as ConnectedSite);
    }

    this.sync();
  };

  hasPermission = (origin: string) => {
    if (!this.lruCache) return;
    if (origin === INTERNAL_REQUEST_ORIGIN) return true;

    return this.lruCache.has(origin);
  };

  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    if (!this.lruCache) return;
    const entries: [string, LRUCache.Entry<ConnectedSite>][] = sites.map((item) => [
      item.origin,
      {
        value: item,
        ttl: 1000 * 60 * 60 * 24 * 30, // 30 days
        size: 1,
      },
    ]);
    this.lruCache.load(entries);
    this.sync(); // This will save the new state to dumpCacheV2
  };

  getRecentConnectedSites = () => {
    const sites = this.lruCache ? Array.from(this.lruCache.values()) : [];
    const pinnedSites = sites
      .filter((item) => item?.isTop)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const recentSites = sites.filter((item) => !item.isTop);
    return [...pinnedSites, ...recentSites];
  };

  getConnectedSites = () => {
    return this.lruCache ? Array.from(this.lruCache.values()) : [];
  };

  getConnectedSite = (key: string) => {
    return this.lruCache?.get(key);
  };

  topConnectedSite = (origin: string, order?: number) => {
    const site = this.getConnectedSite(origin);
    if (!site || !this.lruCache) return;
    const orders = this.getRecentConnectedSites()
      .map((item) => item.order)
      .filter((o): o is number => o !== undefined);
    const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
    order = order ?? maxOrder + 1;
    this.updateConnectSite(origin, {
      ...site,
      order,
      isTop: true,
    });
  };

  unpinConnectedSite = (origin: string) => {
    const site = this.getConnectedSite(origin);
    if (!site || !this.lruCache) return;
    this.updateConnectSite(origin, {
      ...site,
      isTop: false,
    });
  };

  removeConnectedSite = (origin: string) => {
    if (!this.lruCache) return;

    this.lruCache.delete(origin);
    this.sync();
  };

  isInternalOrigin = (origin: string) => {
    return origin === INTERNAL_REQUEST_ORIGIN;
  };
}

export default new PermissionService();
