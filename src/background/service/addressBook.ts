import { createPersistStore } from 'background/utils';
import { Contact } from './networkModel'

interface AddressBookStore {
  addressBook: Record<string, Contact[]>;
  recent: Record<string, Contact[]>;
}

// const empty: Contact = {
//   address: '',
//   avatar: '',
//   contactName: '',
//   contactType: 0,
//   domain: {
//     domainType:0,
//     value:'',
//   },
//   id: 0,
//   username: '',
// }

class AddressBook {
  store!: AddressBookStore;

  init = async () => {
    this.store = await createPersistStore<AddressBookStore>({
      name: 'addressBook',
      template: {
        addressBook:  {
          testnet:[],
          crescendo:[],
          mainnet:[],
        },
        recent: {
          testnet:[],
          crescendo:[],
          mainnet:[],
        }
      },
    });
  };

  getAllContact = () => {
    return this.store;
  };

  getRecent = (network: string) => {
    return this.store.recent[network];
  };

  setRecent = (data: Contact, network: string) => {
    let current = this.store.recent[network];
    if (!current) {
      current =[];
    }
    if (current.length === 10) {
      current.pop();
    }
    current.unshift(data);
    const unique = this.uniqByKeepFirst(current, it => it.address)
    this.store.recent[network] = unique;
  };

  uniqByKeepFirst = (a, key) => {
    const seen = new Set();
    return a.filter(item => {
      const k = key(item);
      return seen.has(k) ? false : seen.add(k);
    });
  }

  getAddresBook = (network: string) => {
    return this.store.addressBook[network];
  };

  setAddressBook = (data: Array<Contact>, network: string) => {
    this.store.addressBook[network] = data;
  }

  clear = () => {
    this.store = {
      addressBook: {
        testnet:[],
        crescendo:[],
        mainnet:[],
      },
      recent: {
        testnet:[],
        crescendo:[],
        mainnet:[],
      }
    }
  }
}

export default new AddressBook();
