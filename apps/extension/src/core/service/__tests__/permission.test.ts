import { LRUCache } from 'lru-cache';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { INTERNAL_REQUEST_ORIGIN } from '@onflow/flow-wallet-shared/constant/domain-constants';
import { MAINNET_CHAIN_ID } from '@onflow/flow-wallet-shared/types/network-types';

import storage from '@/extension-shared/utils/storage';

import permissionService, { type ConnectedSite } from '../permission';

// Mock dependencies
vi.mock('@/extension-shared/utils/storage', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../utils/persistStore', () => ({
  default: vi.fn(),
}));

vi.mock('@onflow/flow-wallet-shared/utils/console-log', () => ({
  consoleInfo: vi.fn(),
  consoleWarn: vi.fn(),
}));

describe('PermissionService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the service state
    permissionService.lruCache = undefined;
    permissionService.store = { dumpCache: [] };

    // Import the mock here to get fresh instance
    const { default: createPersistStore } = await import('../../utils/persistStore');

    // Default mock implementation for persistStore - returns empty cache
    vi.mocked(createPersistStore).mockImplementation(async ({ template }) => {
      // Return template by default (empty cache)
      return template || {};
    });
  });

  describe('init', () => {
    it('should initialize with empty cache when no data exists', async () => {
      vi.mocked(storage.get).mockResolvedValue(null);

      await permissionService.init();

      expect(permissionService.lruCache).toBeDefined();
      expect(permissionService.lruCache?.size).toBe(0);
      expect(permissionService.store.dumpCache).toEqual([]);
    });

    it('should migrate from old cache format', async () => {
      const oldCacheData = {
        dumpCache: [
          {
            k: 'https://example.com',
            v: {
              origin: 'https://example.com',
              name: 'Example Site',
              icon: 'icon.png',
              chain: MAINNET_CHAIN_ID,
              isSigned: false,
              isTop: false,
            },
            e: 0,
          },
        ],
      };

      // Mock storage.get to return old cache data when asked for 'permission' key
      vi.mocked(storage.get).mockImplementation(async (key) => {
        if (key === 'permission') {
          return oldCacheData;
        }
        return null;
      });

      await permissionService.init();

      expect(permissionService.lruCache).toBeDefined();
      expect(permissionService.lruCache?.size).toBe(1);
      expect(permissionService.lruCache?.get('https://example.com')).toEqual({
        origin: 'https://example.com',
        name: 'Example Site',
        icon: 'icon.png',
        chain: MAINNET_CHAIN_ID,
        isSigned: false,
        isTop: false,
      });
    });

    it('should skip invalid entries during migration', async () => {
      const oldCacheData = {
        dumpCache: [
          {
            k: 'valid-site.com',
            v: {
              origin: 'valid-site.com',
              name: 'Valid Site',
              icon: 'icon.png',
            },
            e: 0,
          },
          {
            k: 'invalid-site',
            v: null, // Invalid entry
          },
          {
            k: 'missing-fields',
            v: {
              origin: 'missing-fields',
              // Missing required fields
            },
          },
        ],
      };

      // Mock storage.get to return old cache data when asked for 'permission' key
      vi.mocked(storage.get).mockImplementation(async (key) => {
        if (key === 'permission') {
          return oldCacheData;
        }
        return null;
      });

      await permissionService.init();

      expect(permissionService.lruCache?.size).toBe(1);
      expect(permissionService.lruCache?.has('valid-site.com')).toBe(true);
      expect(permissionService.lruCache?.has('invalid-site')).toBe(false);
      expect(permissionService.lruCache?.has('missing-fields')).toBe(false);
    });

    it('should handle LRUCache initialization with proper options', async () => {
      await permissionService.init();

      expect(permissionService.lruCache).toBeDefined();
      // Test that the cache was created with proper options
      const cache = permissionService.lruCache as LRUCache<string, ConnectedSite>;
      expect(cache.max).toBe(1000);
      expect(cache.ttl).toBe(1000 * 60 * 60 * 24 * 30); // 30 days
      // This should be present to avoid the error
      expect(cache.maxSize).toBeDefined();
    });

    it('should load existing cache dump correctly', async () => {
      const existingDump: [string, LRUCache.Entry<ConnectedSite>][] = [
        [
          'site1.com',
          {
            value: {
              origin: 'site1.com',
              name: 'Site 1',
              icon: 'icon1.png',
              chain: MAINNET_CHAIN_ID,
              isSigned: true,
              isTop: true,
            },
            ttl: 1000 * 60 * 60 * 24 * 30,
            size: 1,
          },
        ],
      ];

      // Mock the persistStore to return our existing data
      const { default: createPersistStore } = await import('../../utils/persistStore');
      vi.mocked(createPersistStore).mockResolvedValueOnce({
        dumpCache: existingDump,
      });

      await permissionService.init();

      expect(permissionService.lruCache?.size).toBe(1);
      // Check if the data is loaded correctly
      const loadedSite = permissionService.lruCache?.get('site1.com');
      expect(loadedSite).toEqual({
        origin: 'site1.com',
        name: 'Site 1',
        icon: 'icon1.png',
        chain: MAINNET_CHAIN_ID,
        isSigned: true,
        isTop: true,
      });
    });
  });

  describe('addConnectedSite', () => {
    beforeEach(async () => {
      await permissionService.init();
    });

    it('should add a new connected site', () => {
      permissionService.addConnectedSite(
        'https://test.com',
        'Test Site',
        'test-icon.png',
        MAINNET_CHAIN_ID,
        true
      );

      const site = permissionService.lruCache?.get('https://test.com');
      expect(site).toEqual({
        origin: 'https://test.com',
        name: 'Test Site',
        icon: 'test-icon.png',
        chain: MAINNET_CHAIN_ID,
        isSigned: true,
        isTop: false,
      });
    });

    it('should use default values when not provided', () => {
      permissionService.addConnectedSite('https://default.com', 'Default Site', 'icon.png');

      const site = permissionService.lruCache?.get('https://default.com');
      expect(site).toEqual({
        origin: 'https://default.com',
        name: 'Default Site',
        icon: 'icon.png',
        chain: MAINNET_CHAIN_ID,
        isSigned: false,
        isTop: false,
      });
    });

    it('should sync after adding', () => {
      const syncSpy = vi.spyOn(permissionService, 'sync');

      permissionService.addConnectedSite('https://sync.com', 'Sync Site', 'icon.png');

      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('touchConnectedSite', () => {
    beforeEach(async () => {
      await permissionService.init();
      permissionService.addConnectedSite('https://touch.com', 'Touch Site', 'icon.png');
    });

    it('should update LRU access time', () => {
      const getSpy = vi.spyOn(permissionService.lruCache!, 'get');

      permissionService.touchConnectedSite('https://touch.com');

      expect(getSpy).toHaveBeenCalledWith('https://touch.com');
    });

    it('should ignore internal origin', () => {
      const getSpy = vi.spyOn(permissionService.lruCache!, 'get');

      permissionService.touchConnectedSite(INTERNAL_REQUEST_ORIGIN);

      expect(getSpy).not.toHaveBeenCalled();
    });

    it('should sync after touching', () => {
      const syncSpy = vi.spyOn(permissionService, 'sync');

      permissionService.touchConnectedSite('https://touch.com');

      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('updateConnectSite', () => {
    beforeEach(async () => {
      await permissionService.init();
      permissionService.addConnectedSite('https://update.com', 'Update Site', 'icon.png');
    });

    it('should perform partial update when specified', () => {
      permissionService.updateConnectSite('https://update.com', { name: 'Updated Name' }, true);

      const site = permissionService.lruCache?.get('https://update.com');
      expect(site?.name).toBe('Updated Name');
      expect(site?.icon).toBe('icon.png'); // Original value preserved
    });

    it('should replace entire site when partial is false', () => {
      permissionService.updateConnectSite(
        'https://update.com',
        {
          origin: 'https://update.com',
          name: 'Completely New',
          icon: 'new-icon.png',
          isSigned: true,
          isTop: true,
        },
        false
      );

      const site = permissionService.lruCache?.get('https://update.com');
      expect(site).toEqual({
        origin: 'https://update.com',
        name: 'Completely New',
        icon: 'new-icon.png',
        isSigned: true,
        isTop: true,
      });
    });

    it('should ignore updates for internal origin', () => {
      permissionService.addConnectedSite(INTERNAL_REQUEST_ORIGIN, 'Internal', 'icon.png');
      const setSpy = vi.spyOn(permissionService.lruCache!, 'set');

      permissionService.updateConnectSite(INTERNAL_REQUEST_ORIGIN, { name: 'New Name' });

      expect(setSpy).not.toHaveBeenCalled();
    });

    it('should not update non-existent sites', () => {
      const setSpy = vi.spyOn(permissionService.lruCache!, 'set');

      permissionService.updateConnectSite('https://nonexistent.com', { name: 'New' });

      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('hasPermission', () => {
    beforeEach(async () => {
      await permissionService.init();
      permissionService.addConnectedSite('https://allowed.com', 'Allowed', 'icon.png');
    });

    it('should return true for connected sites', () => {
      expect(permissionService.hasPermission('https://allowed.com')).toBe(true);
    });

    it('should return false for non-connected sites', () => {
      expect(permissionService.hasPermission('https://notallowed.com')).toBe(false);
    });

    it('should always return true for internal origin', () => {
      expect(permissionService.hasPermission(INTERNAL_REQUEST_ORIGIN)).toBe(true);
    });
  });

  describe('topConnectedSite and unpinConnectedSite', () => {
    beforeEach(async () => {
      await permissionService.init();
      permissionService.addConnectedSite('https://site1.com', 'Site 1', 'icon1.png');
      permissionService.addConnectedSite('https://site2.com', 'Site 2', 'icon2.png');
    });

    it('should pin a site to top', () => {
      permissionService.topConnectedSite('https://site1.com');

      const site = permissionService.lruCache?.get('https://site1.com');
      expect(site?.isTop).toBe(true);
      expect(site?.order).toBe(1);
    });

    it('should handle multiple pinned sites with proper ordering', () => {
      permissionService.topConnectedSite('https://site1.com');
      permissionService.topConnectedSite('https://site2.com');

      const site1 = permissionService.lruCache?.get('https://site1.com');
      const site2 = permissionService.lruCache?.get('https://site2.com');

      expect(site1?.order).toBe(1);
      expect(site2?.order).toBe(2);
    });

    it('should unpin a site', () => {
      permissionService.topConnectedSite('https://site1.com');
      permissionService.unpinConnectedSite('https://site1.com');

      const site = permissionService.lruCache?.get('https://site1.com');
      expect(site?.isTop).toBe(false);
    });

    it('should respect custom order when pinning', () => {
      permissionService.topConnectedSite('https://site1.com', 5);

      const site = permissionService.lruCache?.get('https://site1.com');
      expect(site?.order).toBe(5);
    });
  });

  describe('getRecentConnectedSites', () => {
    beforeEach(async () => {
      await permissionService.init();
    });

    it('should return pinned sites first, then recent sites', () => {
      permissionService.addConnectedSite('https://recent1.com', 'Recent 1', 'icon1.png');
      permissionService.addConnectedSite('https://pinned1.com', 'Pinned 1', 'icon2.png');
      permissionService.addConnectedSite('https://recent2.com', 'Recent 2', 'icon3.png');
      permissionService.addConnectedSite('https://pinned2.com', 'Pinned 2', 'icon4.png');

      permissionService.topConnectedSite('https://pinned1.com', 2);
      permissionService.topConnectedSite('https://pinned2.com', 1);

      const sites = permissionService.getRecentConnectedSites();

      expect(sites[0].origin).toBe('https://pinned2.com'); // order 1
      expect(sites[1].origin).toBe('https://pinned1.com'); // order 2
      expect(sites[2].isTop).toBeFalsy();
      expect(sites[3].isTop).toBeFalsy();
    });
  });

  describe('removeConnectedSite', () => {
    beforeEach(async () => {
      await permissionService.init();
      permissionService.addConnectedSite('https://remove.com', 'Remove', 'icon.png');
    });

    it('should remove a connected site', () => {
      expect(permissionService.hasPermission('https://remove.com')).toBe(true);

      permissionService.removeConnectedSite('https://remove.com');

      expect(permissionService.hasPermission('https://remove.com')).toBe(false);
    });

    it('should sync after removing', () => {
      const syncSpy = vi.spyOn(permissionService, 'sync');

      permissionService.removeConnectedSite('https://remove.com');

      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('setRecentConnectedSites', () => {
    beforeEach(async () => {
      await permissionService.init();
    });

    it('should replace all sites with new list', () => {
      const newSites: ConnectedSite[] = [
        {
          origin: 'https://new1.com',
          name: 'New 1',
          icon: 'icon1.png',
          chain: MAINNET_CHAIN_ID,
          isSigned: true,
          isTop: false,
        },
        {
          origin: 'https://new2.com',
          name: 'New 2',
          icon: 'icon2.png',
          chain: MAINNET_CHAIN_ID,
          isSigned: false,
          isTop: true,
          order: 1,
        },
      ];

      permissionService.setRecentConnectedSites(newSites);

      expect(permissionService.lruCache?.size).toBe(2);
      expect(permissionService.getConnectedSite('https://new1.com')).toEqual(newSites[0]);
      expect(permissionService.getConnectedSite('https://new2.com')).toEqual(newSites[1]);
    });

    it('should sync after setting sites', () => {
      const syncSpy = vi.spyOn(permissionService, 'sync');

      permissionService.setRecentConnectedSites([]);

      expect(syncSpy).toHaveBeenCalled();
    });
  });

  describe('sync', () => {
    beforeEach(async () => {
      await permissionService.init();
    });

    it('should dump cache to store', () => {
      // Clear any existing cache first
      permissionService.lruCache?.clear();

      permissionService.addConnectedSite('https://sync1.com', 'Sync 1', 'icon1.png');
      permissionService.addConnectedSite('https://sync2.com', 'Sync 2', 'icon2.png');

      permissionService.sync();

      expect(permissionService.store.dumpCache).toHaveLength(2);

      // Check that our sites are in the dump (order might vary)
      const dumpKeys = permissionService.store.dumpCache.map(([key]) => key);
      expect(dumpKeys).toContain('https://sync1.com');
      expect(dumpKeys).toContain('https://sync2.com');
    });

    it('should handle undefined cache gracefully', () => {
      permissionService.lruCache = undefined;

      expect(() => permissionService.sync()).not.toThrow();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle operations when cache is not initialized', () => {
      permissionService.lruCache = undefined;

      expect(() => {
        permissionService.addConnectedSite('test.com', 'Test', 'icon.png');
        permissionService.touchConnectedSite('test.com');
        permissionService.updateConnectSite('test.com', { name: 'New' });
        permissionService.hasPermission('test.com');
        permissionService.removeConnectedSite('test.com');
        permissionService.getRecentConnectedSites();
        permissionService.getConnectedSites();
        permissionService.getConnectedSite('test.com');
        permissionService.setRecentConnectedSites([]);
        permissionService.topConnectedSite('test.com');
        permissionService.unpinConnectedSite('test.com');
      }).not.toThrow();
    });

    it('should handle getWithoutUpdate correctly', () => {
      permissionService.lruCache = new LRUCache<string, ConnectedSite>({
        max: 100,
        ttl: 1000 * 60 * 60,
        maxSize: 100,
        sizeCalculation: () => 1,
      });

      const site: ConnectedSite = {
        origin: 'test.com',
        name: 'Test',
        icon: 'icon.png',
        isSigned: false,
        isTop: false,
      };

      permissionService.lruCache.set('test.com', site);

      // peek should not update LRU order
      const result = permissionService.getWithoutUpdate('test.com');
      expect(result).toEqual(site);
    });
  });

  describe('isInternalOrigin', () => {
    it('should correctly identify internal origin', () => {
      expect(permissionService.isInternalOrigin(INTERNAL_REQUEST_ORIGIN)).toBe(true);
      expect(permissionService.isInternalOrigin('https://example.com')).toBe(false);
    });
  });
});
