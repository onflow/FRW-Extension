export interface StorageArea {
  get(keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }>;
  set(items: { [key: string]: any }): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface StorageInterface {
  local: StorageArea;
  session: StorageArea;
  sync?: StorageArea;
  
  onChanged?: {
    addListener(callback: (changes: { [key: string]: any }, areaName: string) => void): void;
    removeListener(callback: (changes: { [key: string]: any }, areaName: string) => void): void;
  };
}

export interface StorageChange {
  oldValue?: any;
  newValue?: any;
}

export type StorageAreaName = 'local' | 'session' | 'sync';

export interface StorageConfig {
  type: 'chrome' | 'memory' | 'localStorage' | 'custom';
  customAdapter?: StorageInterface;
}