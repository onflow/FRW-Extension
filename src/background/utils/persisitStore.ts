import debounce from 'debounce';

import { storage } from 'background/webapi';

const persistStorage = (name: string, obj: object) => {
  //  if (name === 'userWallets') {
  console.log('persistStorage', name, JSON.parse(JSON.stringify(obj)));
  //x}
  storage.set(name, obj);
};

interface CreatePersistStoreParams<T> {
  name: string;
  template?: T;
  fromStorage?: boolean;
}

const createPersistStore = async <T extends object>({
  name,
  template = Object.create(null),
  fromStorage = true,
}: CreatePersistStoreParams<T>): Promise<T> => {
  let tpl = template;
  console.log('createPersistStore', name, fromStorage);
  if (fromStorage) {
    const storageCache = await storage.get(name);
    console.log('storageCache', storageCache);
    tpl = storageCache || template;
    if (!storageCache) {
      console.log('set storageCache', name, tpl);
      await storage.set(name, tpl);
    }
  }

  const createProxy = <A extends object>(obj: A): A =>
    new Proxy(obj, {
      set(target, prop, value) {
        if (typeof value === 'object' && value !== null) {
          target[prop] = createProxy(value);
        }

        target[prop] = value;

        persistStorage(name, target);

        return true;
      },

      deleteProperty(target, prop) {
        if (Reflect.has(target, prop)) {
          Reflect.deleteProperty(target, prop);

          persistStorage(name, target);
        }

        return true;
      },
    });
  return createProxy<T>(tpl);
};

export default createPersistStore;
