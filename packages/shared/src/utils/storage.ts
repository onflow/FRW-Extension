import { consoleError } from './console-log';

export type StorageChange = chrome.storage.StorageChange;
export type AreaName = chrome.storage.AreaName;

const get = async (prop: string) => {
  const result = await chrome.storage.local.get(prop);

  return prop ? result[prop] : result;
};

const getSession = async (prop: string) => {
  // @ts-ignore

  const result = await chrome.storage.session?.get(prop);

  return prop ? result[prop] : result;
};

const getExpiry = async (prop: string) => {
  const result = await chrome.storage.local.get(prop);

  const data = result[prop];

  const storageData = checkExpiry(data, prop);
  return storageData;
};

const set = (prop: string, value: unknown): Promise<void> => {
  return chrome.storage.local.set({ [prop]: value });
};

const setSession = (prop: string, value: unknown): Promise<void> => {
  return chrome.storage.session?.set({ [prop]: value });
};

const setExpiry = async (prop: string, value: unknown, ttl: number): Promise<void> => {
  const now = new Date();

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  const newValue = JSON.stringify(item);

  return await chrome.storage.local.set({ [prop]: newValue });
};

const checkExpiry = async (value: string, prop: string) => {
  if (!value) {
    return null;
  }
  // Put this in a try catch to avoid breaking the extension
  // If the data is not in the correct format, catching the error will return null
  try {
    const item = JSON.parse(value);
    const now = new Date();
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
      // If the item is expired, delete the item from storage
      // and return null
      await remove(prop);
      return null;
    }
    return item.value;
  } catch (error) {
    consoleError('Error parsing storage data', error);
    try {
      await remove(prop);
    } catch (error) {
      consoleError('Error removing expired storage data', error);
    }
    return null;
  }
};

const remove = async (prop: string) => {
  await chrome.storage.local.remove(prop);
};

const removeSession = async (prop: string) => {
  // @ts-ignore
  await chrome.storage.session?.remove(prop);
};

const clear = async () => {
  await chrome.storage.local.clear();
};

const clearSession = async () => {
  await chrome.storage.session.clear();
};

const addStorageListener = (
  callback: (changes: { [key: string]: StorageChange }, namespace: AreaName) => void
) => {
  chrome.storage.onChanged.addListener(callback);
};

const removeStorageListener = (
  callback: (changes: { [key: string]: StorageChange }, namespace: AreaName) => void
) => {
  chrome.storage.onChanged.removeListener(callback);
};

export default {
  get,
  getSession,
  set,
  setSession,
  getExpiry,
  setExpiry,
  remove,
  removeSession,
  clear,
  clearSession,
  addStorageListener,
  removeStorageListener,
};
