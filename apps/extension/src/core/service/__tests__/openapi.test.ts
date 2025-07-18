import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/service/userWallet', async () => {
  const actual = await vi.importActual('@/core/service/userWallet');
  return {
    default: {
      ...actual,
      getNetwork: vi.fn().mockResolvedValue('testnet'),
      getActiveWallet: vi.fn().mockResolvedValue('test-address'),
      getActiveAccountType: vi.fn().mockReturnValue(null),
      setupFcl: vi.fn(),
      reSign: vi.fn(),
      clear: vi.fn(),
      getEvmAddress: vi.fn().mockResolvedValue('test-address-evm'),
    },
  };
});

vi.mock('@/core/service/nft', () => ({
  default: {
    clear: vi.fn(),
  },
}));

vi.mock('@/core/service/userInfo', () => ({
  default: {
    removeUserInfo: vi.fn(),
  },
}));

vi.mock('@/core/service/coinList', () => ({
  default: {
    clear: vi.fn(),
  },
}));

vi.mock('@/core/service/addressBook', () => ({
  default: {
    clear: vi.fn(),
  },
}));

vi.mock('@/core/service/transaction', () => ({
  default: {
    clear: vi.fn(),
  },
}));

// Mock chrome.storage before any imports
const mockStorage = {
  local: {
    get: vi.fn().mockImplementation(() =>
      Promise.resolve({
        auth: { token: 'mock-token' },
        network: 'testnet',
      })
    ),
    set: vi.fn().mockImplementation(() => Promise.resolve()),
  },
  session: {
    get: vi.fn().mockImplementation(() =>
      Promise.resolve({
        expiry: Date.now() + 1000 * 60 * 60,
        value: {
          version: '1.0.0',
          scripts: {
            mainnet: {
              test: 'test',
            },
            testnet: {
              test: 'test',
            },
          },
        },
      })
    ),
    set: vi.fn().mockImplementation(() => Promise.resolve()),
  },
};

vi.stubGlobal('chrome', { storage: mockStorage });

vi.mock('dayjs', () => {
  return {
    default: () => ({
      unix: () => 1736973455,
      subtract: () => ({
        unix: () => 1736973455,
      }),
      format: () => '2024-01-01',
      utc: () => ({
        format: () => '2024-01-01',
      }),
    }),
  };
});
// Create a typed mock fetch before any imports
const mockFetch = vi.fn();

// Set it as global fetch
vi.stubGlobal('fetch', mockFetch);

// Then imports
import { type FlowNetwork } from '@onflow/flow-wallet-shared/types/network-types';

import { API_TEST_RESULTS } from '@/extension-shared/utils/test-data/api-test-results';
import {
  type CommonParams,
  createTestGroups,
  updateTestParamsFromResults,
} from '@/extension-shared/utils/test-data/test-groups';

import openApiService from '../openapi';
import userWalletService from '../userWallet';

describe('OpenApiService', () => {
  const commonParams: CommonParams = {
    address: 'test-address',
    addressEvm: 'test-address-evm',
    network: 'testnet',
    username: 'coolpanda',
    token: 'flow',
    password: process.env.TEST_PASSWORD || '',
    mnemonicExisting: '',
    mnemonicGenerated: '',
    publicKey: {
      P256: { pubK: '', pk: '' },
      SECP256K1: { pubK: '', pk: '' },
    },
    deviceInfo: {
      device_id: 'test-device',
      district: '',
      name: 'Test Device',
      type: '2',
      user_agent: 'Test',
    },
  };

  beforeEach(async () => {
    mockFetch.mockClear();
    vi.clearAllMocks();

    // Default mock implementation for fetch
    mockFetch.mockImplementation((_url, _init) => {
      const response = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({}),
        clone: function () {
          return {
            ...this,
            json: this.json,
          };
        },
      };
      return Promise.resolve(response);
    });

    // Initialize openApiService before each test
    await openApiService.init();

    // Wait for auth to be initialized
    await new Promise((resolve) => setTimeout(resolve, 0));
  }, 10000); // Increase timeout for setup

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('should make a fetch call with correct parameters', async () => {
      const mockResponse = { data: { result: 'success' } };
      mockFetch.mockImplementationOnce((_url, _init) => {
        const response = {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve(mockResponse),
          clone: function () {
            return {
              ...this,
              json: this.json,
            };
          },
        };
        return Promise.resolve(response);
      });

      const result = await openApiService.sendRequest(
        'GET',
        '/test',
        { param: 'value' },
        {},
        'https://test.com'
      );

      expect(mockFetch).toHaveBeenCalledWith('https://test.com/test?param=value', {
        method: 'GET',
        headers: {
          Network: 'testnet',
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      });
      expect(result).toEqual(mockResponse);
    }, 5000);

    it('should handle errors gracefully', async () => {
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      await expect(
        openApiService.sendRequest('GET', '/test', {}, {}, 'https://test.com')
      ).rejects.toThrow('Network error');
    }, 5000);
  });

  // Test each API function that's not marked as unused in test-groups
  const testGroups = updateTestParamsFromResults(createTestGroups(commonParams), API_TEST_RESULTS);

  Object.entries(testGroups).forEach(([groupName, functions]) => {
    const activeFunctions = functions.filter((func) => !func.unused);

    if (activeFunctions.length === 0) {
      return;
    }

    describe(groupName, () => {
      activeFunctions.forEach((func) => {
        it(`${func.name} should make correct fetch call`, async () => {
          if (func.controlledBy) {
            // Can't test controlledBy functions
            return;
          }

          // Find the test result for this function
          const testResult = API_TEST_RESULTS[groupName]?.find((r) => r.functionName === func.name);

          if (!testResult) {
            console.warn(`No test result found for ${func.name}`);
            return;
          }

          const fetchDetails = testResult.fetchDetails;

          if (!fetchDetails?.length) {
            throw new Error(`No fetch details found for ${func.name}`);
          }

          // Set the network based on the first test data
          const headers = fetchDetails[0].requestInit?.headers as { Network?: string };
          const networkHeader = headers?.Network;
          if (networkHeader) {
            vi.mocked(userWalletService.getNetwork).mockResolvedValue(
              networkHeader.toLowerCase() as FlowNetwork
            );
            // Also update the headers in the mock storage
            mockStorage.local.get.mockImplementation(() =>
              Promise.resolve({
                auth: { token: 'mock-token' },
                network: networkHeader.toLowerCase(),
              })
            );
          }

          // Create a queue of responses
          let callIndex = 0;
          mockFetch.mockImplementation((url, _init) => {
            const currentDetail = fetchDetails[callIndex];

            if (!currentDetail) {
              throw new Error(`Unexpected fetch call to ${url}. All mocked calls were used.`);
            }

            callIndex++;

            const response = {
              ok: true,
              status: 200,
              statusText: 'OK',
              json: () => Promise.resolve(currentDetail.responseData || {}),
              clone: function () {
                return {
                  ...this,
                  json: this.json,
                };
              },
            };
            return Promise.resolve(response);
          });

          try {
            // Call the function with test parameters
            await openApiService[func.name](...Object.values(func.params));

            // Verify each fetch call matches its recorded detail in sequence
            expect(mockFetch).toHaveBeenCalledTimes(fetchDetails.length);
            fetchDetails.forEach((detail, index) => {
              if (detail.requestInit) {
                expect(mockFetch).toHaveBeenNthCalledWith(
                  index + 1,
                  detail.url,
                  detail.requestInit
                );
              } else {
                expect(mockFetch).toHaveBeenNthCalledWith(index + 1, detail.url);
              }
            });
          } catch (error) {
            console.error(`Error testing ${func.name}:`, error);
            console.error('Expected fetch calls:', fetchDetails);
            console.error('Actual fetch calls:', mockFetch.mock.calls);
            throw error;
          }
        }, 5000);
      });
    });
  });
});
