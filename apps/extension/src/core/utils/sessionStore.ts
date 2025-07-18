import { getCachedData, setCachedData } from './data-cache';

interface CreateSessionStoreParams<T> {
  name: string;
  template?: T;
  fromStorage?: boolean;
  ttl?: number;
}

const createSessionStore = async <T extends object>({
  name,
  template = Object.create(null),
  fromStorage = true,
  ttl = 10 * 1000, // 10 seconds
}: CreateSessionStoreParams<T>): Promise<T> => {
  // Always clone the template to avoid mutating the original object
  let tpl = structuredClone(template);

  if (fromStorage) {
    const storageCache = await getCachedData<T>(name);
    tpl = storageCache || template;
    if (!storageCache) {
      await setCachedData(name, tpl, ttl);
    }
  }

  const createProxy = <A extends object>(obj: A): A =>
    new Proxy(obj, {
      set(target, prop, value) {
        if (typeof value === 'object' && value !== null) {
          target[prop] = createProxy(value);
        }

        target[prop] = value;

        setCachedData(name, target, ttl);

        return true;
      },

      deleteProperty(target, prop) {
        if (Reflect.has(target, prop)) {
          Reflect.deleteProperty(target, prop);

          setCachedData(name, target, ttl);
        }

        return true;
      },
    });
  return createProxy<T>(tpl);
};

export default createSessionStore;
