import { type Contact } from '@onflow/flow-wallet-shared/types/network-types';

import createPersistStore from '../utils/persistStore';

interface AddressBookStore {
  addressBook: Record<'mainnet' | 'testnet', Contact[]>;
  recent: Record<'mainnet' | 'testnet', Contact[]>;
}

class AddressBook {
  store!: AddressBookStore;

  init = async () => {
    this.store = await createPersistStore<AddressBookStore>({
      name: 'addressBook',
      template: {
        addressBook: {
          testnet: [],
          mainnet: [],
        },
        recent: {
          testnet: [],
          mainnet: [],
        },
      },
    });
  };

  getAllContacts = (): AddressBookStore => {
    return this.store;
  };

  getRecent = (network: string): Contact[] => {
    return this.store.recent[network];
  };

  setRecent = (data: Contact, network: string) => {
    let current = this.store.recent[network];
    if (!current) {
      current = [];
    }
    if (current.length === 10) {
      current.pop();
    }
    current.unshift(data);
    const unique = this.uniqueByKeepFirst(current, (it) => it.address);
    this.store.recent[network] = unique;
  };

  uniqueByKeepFirst = (a: Contact[], key: (item: Contact) => string) => {
    const seen = new Set();
    return a.filter((item) => {
      const k = key(item);
      return seen.has(k) ? false : seen.add(k);
    });
  };

  getAddressBook = (network: string): Contact[] => {
    return this.store.addressBook[network];
  };

  setAddressBook = (data: Array<Contact>, network: string) => {
    this.store.addressBook[network] = data;
  };

  clear = () => {
    this.store = {
      addressBook: {
        testnet: [],
        mainnet: [],
      },
      recent: {
        testnet: [],
        mainnet: [],
      },
    };
  };
}

export default new AddressBook();
