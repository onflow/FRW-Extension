import storage from '@onflow/flow-wallet-extension-shared/storage';

const persistStorage = (name: string, obj: object) => {
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
  // Always clone the template to avoid mutating the original object
  let tpl = structuredClone(template);
  if (fromStorage) {
    const storageCache = await storage.get(name);
    tpl = storageCache || template;
    if (!storageCache) {
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
