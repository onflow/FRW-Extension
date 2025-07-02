import { sortBy } from 'lodash';

import { CHAINS_ENUM, INTERNAL_REQUEST_ORIGIN } from '@/constant';
import { createPersistStore } from 'background/utils';

import permissionService, { type ConnectedSite } from './permission';

export interface SignTextHistoryItem {
  site: ConnectedSite;
  createAt: number;
  text: string;
  type:
    | 'personalSign'
    | 'ethSignTypedData'
    | 'ethSignTypedDataV1'
    | 'ethSignTypedDataV3'
    | 'ethSignTypedDataV4';
}

interface SignTextHistoryStore {
  history: Record<string, SignTextHistoryItem[]>;
}

class PermissionService {
  store: SignTextHistoryStore = {
    history: {},
  };
  private _txHistoryLimit = 100;

  init = async () => {
    const storage = await createPersistStore<SignTextHistoryStore>({
      name: 'signTextHistory',
      template: {
        history: {},
      },
    });
    this.store = storage || this.store;
  };

  createHistory = ({
    address,
    origin,
    text,
    type,
  }: {
    address: string;
    origin: string;
    text: string;
    type: SignTextHistoryItem['type'];
  }) => {
    let site = permissionService.getConnectedSite(origin);
    if (origin === INTERNAL_REQUEST_ORIGIN) {
      site = {
        origin: INTERNAL_REQUEST_ORIGIN,
        icon: '',
        name: 'Flow Wallet',
        chain: 646,
        isSigned: false,
        isTop: false,
        isConnected: true,
      };
    }

    if (!site) {
      return;
    }

    const history = this.store.history[address.toLowerCase()] || [];

    this.store.history = {
      ...this.store.history,
      [address.toLowerCase()]: [
        ...history,
        {
          site,
          createAt: Date.now(),
          text: typeof text === 'string' ? text : JSON.stringify(text),
          type,
        },
      ],
    };
    this.clearAllExpiredHistory();
  };

  clearAllExpiredHistory = () => {
    const history: {
      address: string;
      data: SignTextHistoryItem;
    }[] = [];

    Object.entries(this.store.history).forEach(([address, list]) => {
      history.push(...list.map((data) => ({ address, data })));
    });
    const txsToDelete = sortBy(history, (item) => item.data.createAt)
      .reverse()
      .slice(this._txHistoryLimit);

    txsToDelete.forEach(({ address, data }) => {
      const list = this.store.history[address];
      if (!list) return;
      const index = list.findIndex((item) => item === data);
      if (index !== -1) {
        list.splice(index, 1);
      }
    });
    this.store.history = {
      ...this.store.history,
    };
  };
}

export default new PermissionService();
