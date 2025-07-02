import type { StorageInterface, StorageArea } from '@frw/core/interfaces/storage.interface';

export class ChromeStorageAdapter implements StorageInterface {
  local: StorageArea;
  session: StorageArea;
  sync: StorageArea;
  
  onChanged = {
    addListener: (callback: (changes: { [key: string]: any }, areaName: string) => void) => {
      chrome.storage.onChanged.addListener(callback);
    },
    removeListener: (callback: (changes: { [key: string]: any }, areaName: string) => void) => {
      chrome.storage.onChanged.removeListener(callback);
    }
  };

  constructor() {
    this.local = this.createStorageArea(chrome.storage.local);
    this.session = this.createStorageArea(chrome.storage.session);
    this.sync = this.createStorageArea(chrome.storage.sync);
  }

  private createStorageArea(chromeArea: chrome.storage.StorageArea): StorageArea {
    return {
      get: (keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }> => {
        return new Promise((resolve, reject) => {
          chromeArea.get(keys, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      },
      
      set: (items: { [key: string]: any }): Promise<void> => {
        return new Promise((resolve, reject) => {
          chromeArea.set(items, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      },
      
      remove: (keys: string | string[]): Promise<void> => {
        return new Promise((resolve, reject) => {
          chromeArea.remove(keys, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      },
      
      clear: (): Promise<void> => {
        return new Promise((resolve, reject) => {
          chromeArea.clear(() => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
    };
  }
}