import type { StorageInterface, StorageArea, StorageChange } from '@frw/core/interfaces/storage.interface';

export class MemoryStorageAdapter implements StorageInterface {
  private localData: Map<string, any> = new Map();
  private sessionData: Map<string, any> = new Map();
  private syncData: Map<string, any> = new Map();
  private listeners: Array<(changes: { [key: string]: StorageChange }, areaName: string) => void> = [];

  local: StorageArea;
  session: StorageArea;
  sync: StorageArea;
  
  onChanged = {
    addListener: (callback: (changes: { [key: string]: StorageChange }, areaName: string) => void) => {
      this.listeners.push(callback);
    },
    removeListener: (callback: (changes: { [key: string]: StorageChange }, areaName: string) => void) => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    }
  };

  constructor() {
    this.local = this.createStorageArea(this.localData, 'local');
    this.session = this.createStorageArea(this.sessionData, 'session');
    this.sync = this.createStorageArea(this.syncData, 'sync');
  }

  private notifyListeners(changes: { [key: string]: StorageChange }, areaName: string) {
    this.listeners.forEach(listener => {
      try {
        listener(changes, areaName);
      } catch (error) {
        console.error('Error in storage listener:', error);
      }
    });
  }

  private createStorageArea(dataMap: Map<string, any>, areaName: string): StorageArea {
    return {
      get: async (keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }> => {
        if (keys === null) {
          // Return all data
          const result: { [key: string]: any } = {};
          dataMap.forEach((value, key) => {
            result[key] = value;
          });
          return result;
        }

        const result: { [key: string]: any } = {};
        
        if (typeof keys === 'string') {
          const value = dataMap.get(keys);
          if (value !== undefined) {
            result[keys] = value;
          }
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            const value = dataMap.get(key);
            if (value !== undefined) {
              result[key] = value;
            }
          });
        } else if (typeof keys === 'object') {
          Object.entries(keys).forEach(([key, defaultValue]) => {
            const value = dataMap.get(key);
            result[key] = value !== undefined ? value : defaultValue;
          });
        }

        return result;
      },
      
      set: async (items: { [key: string]: any }): Promise<void> => {
        const changes: { [key: string]: StorageChange } = {};
        
        Object.entries(items).forEach(([key, value]) => {
          const oldValue = dataMap.get(key);
          dataMap.set(key, value);
          
          changes[key] = {
            oldValue,
            newValue: value
          };
        });

        this.notifyListeners(changes, areaName);
      },
      
      remove: async (keys: string | string[]): Promise<void> => {
        const changes: { [key: string]: StorageChange } = {};
        const keysArray = Array.isArray(keys) ? keys : [keys];
        
        keysArray.forEach(key => {
          const oldValue = dataMap.get(key);
          if (dataMap.delete(key)) {
            changes[key] = {
              oldValue,
              newValue: undefined
            };
          }
        });

        if (Object.keys(changes).length > 0) {
          this.notifyListeners(changes, areaName);
        }
      },
      
      clear: async (): Promise<void> => {
        const changes: { [key: string]: StorageChange } = {};
        
        dataMap.forEach((value, key) => {
          changes[key] = {
            oldValue: value,
            newValue: undefined
          };
        });
        
        dataMap.clear();
        
        if (Object.keys(changes).length > 0) {
          this.notifyListeners(changes, areaName);
        }
      }
    };
  }

  // Utility method for testing - clear all data
  clearAll(): void {
    this.localData.clear();
    this.sessionData.clear();
    this.syncData.clear();
  }
}