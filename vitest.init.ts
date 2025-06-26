import dotenv from 'dotenv';
import { vi } from 'vitest';

dotenv.config({ path: ['.env.test'] });

// Set up environment variables
vi.stubEnv('NODE_ENV', 'test');

vi.stubEnv('API_GO_SERVER_URL', 'https://test.com');
vi.stubEnv('API_BASE_URL', 'https://test.com');
vi.stubEnv('FB_FUNCTIONS', 'https://test.com');

vi.stubEnv('API_NEWS_PATH', '/config/news.test.json');
vi.stubEnv('API_CONFIG_PATH', '/config/config.test.json');

// Mock global fetch
global.fetch = vi.fn();

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn(),
    getManifest: () => ({ version: '1.0.0' }),
    getPlatformInfo: () => ({
      os: 'mac',
      arch: 'arm64',
      version: '10.15.7',
    }),
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  windows: {
    query: vi.fn(),
    create: vi.fn(),
    onFocusChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
} as any;

// Mock Firebase Auth
const mockAuth = {
  currentUser: {
    getIdToken: () => Promise.resolve('mock-token'),
    isAnonymous: false,
  },
  isInitialized: false,
};

vi.mock('firebase/auth/web-extension', () => ({
  getAuth: vi.fn(() => ({
    currentUser: mockAuth.currentUser,
    onAuthStateChanged: (callback) => {
      // Simulate auth initialization
      setTimeout(() => {
        mockAuth.isInitialized = true;
        callback(mockAuth.currentUser);
      }, 0);
      return () => {};
    },
  })),
  signInWithCustomToken: vi.fn(),
  signInAnonymously: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(mockAuth.currentUser);
    return () => {};
  }),
  getApp: vi.fn(() => ({})),
  initializeApp: vi.fn(() => ({})),
  indexedDBLocalPersistence: vi.fn(),
  setPersistence: vi.fn((_auth, _persistence) => ({})),
}));

// Mock storage utility
vi.mock('@/background/utils/storage', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    getExpiry: vi.fn().mockResolvedValue(null),
    setExpiry: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock MixpanelService
vi.mock('@/background/service/mixpanel', () => ({
  mixpanelTrack: {
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    setPeople: vi.fn(),
    trackPageView: vi.fn(),
    time: vi.fn(),
    init: vi.fn(),
    getIdInfo: vi.fn().mockResolvedValue({ $device_id: 'mock-device-id' }),
  },
  MixpanelService: {
    instance: {
      track: vi.fn(),
      identify: vi.fn(),
      reset: vi.fn(),
      setPeople: vi.fn(),
      trackPageView: vi.fn(),
      time: vi.fn(),
      init: vi.fn(),
    },
  },
}));

// Export mockAuth and fetch for use in tests
export { mockAuth };
