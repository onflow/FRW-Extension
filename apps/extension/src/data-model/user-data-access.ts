import storage from '@/extension-shared/utils/storage';

/**
 * Get user data from local storage
 * @param key - The key to get the data from
 * @returns The cached data or undefined if it doesn't exist or is expired
 */
export const getUserData = async <T>(key: string): Promise<T | undefined> => {
  const userData = await storage.get(key);
  return userData as T | undefined;
};

/**
 * Set user data in local storage
 * @param key - The key to set the data to
 * @param data - The data to set
 */
export const setUserData = async <T>(key: string, data: T) => {
  await storage.set(key, data);
};

/**
 * Set user data in local storage
 * @param key - The key to set the data to
 * @param data - The data to set
 */
export const removeUserData = async (key: string) => {
  await storage.remove(key);
};

/**
 * Internal function to call the update callback
 * @param key - The key to listen for
 * @param updateCallback - The callback to call when the data is updated
 */
const _updateCaller = (key: string, updateCallback: (key: string, data: unknown) => void) => {
  return (changes, areaName: string) => {
    if ((areaName === 'local' || areaName === 'sync') && changes[`${key}`]) {
      updateCallback(key, changes[key].newValue);
    }
  };
};
/**
 * Listen for a data update event from the background script
 * The frontend should use this to update the data in the frontend
 * @param key - The key to listen for
 * @param updateCallback - The callback to call when the data is updated
 */
export const addUserDataListener = (
  key: string,
  updateCallback: (key: string, data: unknown) => void
) => {
  chrome.storage.onChanged.addListener(_updateCaller(key, updateCallback));
};

/**
 * Remove a cached data listener
 * @param key - The key to remove the listener for
 * @param updateCallback - The callback to remove
 */
export const removeUserDataListener = (
  key: string,
  updateCallback: (key: string, data: unknown) => void
) => {
  chrome.storage.onChanged.removeListener(_updateCaller(key, updateCallback));
};
