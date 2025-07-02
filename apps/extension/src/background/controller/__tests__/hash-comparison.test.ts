import * as ethSigUtil from '@metamask/eth-sig-util';
import { ethers } from 'ethers';
import { test, expect, describe, vi, beforeAll } from 'vitest';

// Import TypedDataUtils directly from the controller
import { TypedDataUtils } from '../provider/controller';

// Mock all necessary services
vi.mock('@/background/service', () => ({
  openapiService: {
    getFeatureFlag: vi.fn().mockResolvedValue(false),
  },
  mixpanelTrack: {
    identify: vi.fn(),
    track: vi.fn(),
  },
  permissionService: {},
  sessionService: {},
  signTextHistoryService: {
    createHistory: vi.fn(),
  },
  keyringService: {
    getCurrentPublicPrivateKeyTuple: vi.fn().mockResolvedValue({
      P256: {
        pk: '1111111111111111111111111111111111111111111111111111111111111111',
        pub: '0222222222222222222222222222222222222222222222222222222222222222',
      },
      SECP256K1: {
        pk: '1111111111111111111111111111111111111111111111111111111111111111',
        pub: '0222222222222222222222222222222222222222222222222222222222222222',
      },
    }),
  },
  notificationService: {
    requestApproval: vi.fn().mockResolvedValue(true),
  },
  userWalletService: {
    setupFcl: vi.fn(),
    getCurrentEvmAddress: vi.fn().mockResolvedValue('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
  },
}));

// Mock only the default export from controller, not TypedDataUtils
vi.mock('../provider/controller', async () => {
  // Get the actual module
  const actual = await vi.importActual('../provider/controller');

  return {
    // Keep the actual TypedDataUtils implementation
    TypedDataUtils: actual.TypedDataUtils,
    // Mock the default export
    default: {
      signTypeData: vi.fn().mockResolvedValue('MOCKED_SIGNATURE'),
    },
  };
});

/**
 * EIP-712 Hash Implementation Comparison
 *
 * This test compares three different implementations of EIP-712 message hashing:
 * 1. Original implementation from controller: Uses {[primaryType]: types[primaryType], ...types} constructor style
 * 2. Direct ethers implementation: Uses ethers.TypedDataEncoder.hash directly
 * 3. Metamask implementation: Uses @metamask/eth-sig-util for comparison with another library
 *
 * Key findings:
 * - All three implementations produce identical hashes
 * - Complex nested types with fixed arrays like OrderComponents[2] work correctly
 * - The most important thing is removing EIP712Domain before calling any TypedDataEncoder methods
 * - Our controller's existing implementation already handles complex types correctly
 *
 * This is important for Web3 compatibility as it ensures our wallet can correctly sign complex
 * data structures from various dapps like NFT marketplaces that use nested array types.
 */

describe('EIP-712 Hash Implementation Comparison', () => {
  test('Compare hash implementations with complex nested types', () => {
    const typedData = {
      domain: {
        name: 'Test Protocol',
        version: '1',
        chainId: 1,
        verifyingContract: '0x1234567890123456789012345678901234567890',
      },
      primaryType: 'BulkOrder',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        BulkOrder: [{ name: 'tree', type: 'OrderComponents[2]' }],
        OrderComponents: [
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          { name: 'offer', type: 'OfferItem[]' },
          { name: 'consideration', type: 'ConsiderationItem[]' },
          { name: 'orderType', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'zoneHash', type: 'bytes32' },
          { name: 'salt', type: 'uint256' },
          { name: 'conduitKey', type: 'bytes32' },
          { name: 'counter', type: 'uint256' },
        ],
        OfferItem: [
          { name: 'itemType', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'identifierOrCriteria', type: 'uint256' },
          { name: 'startAmount', type: 'uint256' },
          { name: 'endAmount', type: 'uint256' },
        ],
        ConsiderationItem: [
          { name: 'itemType', type: 'uint8' },
          { name: 'token', type: 'address' },
          { name: 'identifierOrCriteria', type: 'uint256' },
          { name: 'startAmount', type: 'uint256' },
          { name: 'endAmount', type: 'uint256' },
          { name: 'recipient', type: 'address' },
        ],
      },
      message: {
        tree: [
          {
            offerer: '0xAAA5678901234567890123456789012345678901',
            zone: '0x0000000000000000000000000000000000000000',
            offer: [
              {
                itemType: 1,
                token: '0xBBB5678901234567890123456789012345678901',
                identifierOrCriteria: '1000000000000000000',
                startAmount: '1000000000000000000',
                endAmount: '1000000000000000000',
              },
            ],
            consideration: [
              {
                itemType: 1,
                token: '0xCCC5678901234567890123456789012345678901',
                identifierOrCriteria: '0',
                startAmount: '2000000000000000000',
                endAmount: '2000000000000000000',
                recipient: '0xAAA5678901234567890123456789012345678901',
              },
            ],
            orderType: 0,
            startTime: '1634000000',
            endTime: '1734000000',
            zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            salt: '123456789',
            conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
            counter: '0',
          },
          {
            offerer: '0xDDD5678901234567890123456789012345678901',
            zone: '0x0000000000000000000000000000000000000000',
            offer: [
              {
                itemType: 2,
                token: '0xEEE5678901234567890123456789012345678901',
                identifierOrCriteria: '2000000000000000000',
                startAmount: '1000000000000000000',
                endAmount: '1000000000000000000',
              },
            ],
            consideration: [
              {
                itemType: 2,
                token: '0xFFF5678901234567890123456789012345678901',
                identifierOrCriteria: '0',
                startAmount: '3000000000000000000',
                endAmount: '3000000000000000000',
                recipient: '0xDDD5678901234567890123456789012345678901',
              },
            ],
            orderType: 1,
            startTime: '1634000000',
            endTime: '1734000000',
            zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            salt: '987654321',
            conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
            counter: '0',
          },
        ],
      },
    };

    // Implementation from controller - using the actual imported TypedDataUtils
    function controllerImplementation(message: any): string {
      const hash = TypedDataUtils.eip712Hash(message, 'V4');
      return '0x' + hash.toString('hex');
    }

    // Direct ethers way
    function ethersDirectImplementation(domain: any, types: any, message: any): string {
      const typesWithoutDomain = { ...types } as any;
      delete typesWithoutDomain.EIP712Domain;

      return ethers.TypedDataEncoder.hash(domain, typesWithoutDomain, message);
    }

    // Metamask implementation
    function metamaskImplementation(message: any): string {
      return (
        '0x' +
        ethSigUtil.TypedDataUtils.eip712Hash(message, ethSigUtil.SignTypedDataVersion.V4).toString(
          'hex'
        )
      );
    }

    // Test all implementations and compare the output
    const controllerHash = controllerImplementation(typedData);
    console.log('Controller implementation hash:', controllerHash);

    const ethersHash = ethersDirectImplementation(
      typedData.domain,
      typedData.types,
      typedData.message
    );
    console.log('Ethers direct hash:', ethersHash);

    const metamaskHash = metamaskImplementation(typedData);
    console.log('Metamask hash:', metamaskHash);

    // Compare the hashes
    expect(controllerHash).toBe(ethersHash);
    expect(metamaskHash).toBe(ethersHash);

    console.log('✓ All implementations produce the same hash!');
    console.log(
      '→ This confirms that our controller implementation works correctly with complex nested types.'
    );
    console.log(
      '→ The key issue was ensuring EIP712Domain is removed before calling any TypedDataEncoder methods.'
    );
  });
});
