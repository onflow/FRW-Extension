import { max } from 'lodash';
import LRU from 'lru-cache';

import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { createPersistStore } from 'background/utils';
import { INTERNAL_REQUEST_ORIGIN } from 'consts';

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

export type PermissionStore = {
  dumpCache: ReadonlyArray<LRU.Entry<string, ConnectedSite>>;
};

class PermissionService {
  store: PermissionStore = {
    dumpCache: [],
  };
  lruCache: LRU<string, ConnectedSite> | undefined;

  init = async () => {
    this.store = await createPersistStore<PermissionStore>({
      name: 'permission',
      template: {
        dumpCache: [],
      },
    });

    // @todo add a size limit to the LRU cache
    // We're creating a new LRU cache here with no size limit.
    // That's the whole point of the LRU cache.

    this.lruCache = new LRU();
    const cache: ReadonlyArray<LRU.Entry<string, ConnectedSite>> = (this.store.dumpCache || []).map(
      (item) => ({
        k: item.k,
        v: item.v,
        e: 0,
      })
    );
    this.lruCache.load(cache);
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

  touchConnectedSite = (origin) => {
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

  hasPermission = (origin) => {
    if (!this.lruCache) return;
    if (origin === INTERNAL_REQUEST_ORIGIN) return true;

    return this.lruCache.has(origin);
  };

  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    this.lruCache?.load(
      sites.map((item) => ({
        e: 0,
        k: item.origin,
        v: item,
      }))
    );
    this.sync();
  };

  getRecentConnectedSites = () => {
    const sites = this.lruCache?.values() || [];
    const pinnedSites = sites
      .filter((item) => item?.isTop)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const recentSites = sites.filter((item) => !item.isTop);
    return [...pinnedSites, ...recentSites];
  };

  getConnectedSites = () => {
    return this.lruCache?.values() || [];
  };

  getConnectedSite = (key: string) => {
    return this.lruCache?.get(key);
  };

  topConnectedSite = (origin: string, order?: number) => {
    const site = this.getConnectedSite(origin);
    if (!site || !this.lruCache) return;
    order = order ?? (max(this.getRecentConnectedSites().map((item) => item.order)) || 0) + 1;
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

    this.lruCache.del(origin);
    this.sync();
  };

  // getSitesByDefaultChain = (chain: CHAINS_ENUM) => {
  //   if (!this.lruCache) return [];
  //   return this.lruCache.values().filter((item) => item.chain === chain);
  // };

  isInternalOrigin = (origin: string) => {
    return origin === INTERNAL_REQUEST_ORIGIN;
  };
}

export default new PermissionService();
