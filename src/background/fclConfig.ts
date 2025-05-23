import * as fcl from '@onflow/fcl';

import { consoleError, consoleWarn } from '@/shared/utils/console-log';

import { isValidNetwork, type FlowNetwork } from '../shared/types/network-types';

import { storage } from './webapi';

const CONTRACTS_URL =
  process.env.NODE_ENV === 'dev'
    ? 'https://us-central1-lilico-dev.cloudfunctions.net/contracts'
    : 'https://us-central1-lilico-334404.cloudfunctions.net/contracts';

// Fallback values for critical contracts (useful when fetch fails)
const fallbackContracts = {
  mainnet: {
    '0xDomains': '0x233eb012d34b0070',
    '0xFind': '0x097bafa4e0b48eef',
    '0xFlowFees': '0xf919ee77447b7497',
    '0xFlowIDTableStaking': '0x8624b52f9ddcd04a',
    '0xFlowns': '0x233eb012d34b0070',
    '0xFlowTableStaking': '0x8624b52f9ddcd04a',
    '0xFlowToken': '0x1654653399040a61',
    '0xFungibleToken': '0xf233dcee88fe0abe',
    '0xHybridCustody': '0xd8a7e05a7ac670c0',
    '0xLockedTokens': '0x8d0e87b65159ae63',
    '0xMetadataViews': '0x1d7e57aa55817448',
    '0xNonFungibleToken': '0x1d7e57aa55817448',
    '0xStakingCollection': '0x8d0e87b65159ae63',
    '0xFlowStakingCollection': '0x8d0e87b65159ae63',
    '0xStakingProxy': '0x62430cf28c26d095',
    '0xSwapError': '0xb78ef7afa52ff906',
    '0xSwapRouter': '0xa6850776a94e6551',
    '0xEVM': '0xe467b9dd11fa00df',
    '0xFlowEVMBridge': '0x1e4aa0b87d10b141',
    '0xCapabilityFilter': '0xd8a7e05a7ac670c0',
    '0xFlowEVMBridgeConfig': '0x1e4aa0b87d10b141',
  },
  testnet: {
    '0xDomains': '0xb05b2abb42335e88',
    '0xFind': '0xa16ab1d0abde3625',
    '0xFlowFees': '0x912d5440f7e3769e',
    '0xFlowIDTableStaking': '0x9eca2b38b18b5dfe',
    '0xFlowns': '0xb05b2abb42335e88',
    '0xFlowTableStaking': '0x9eca2b38b18b5dfe',
    '0xFlowToken': '0x7e60df042a9c0868',
    '0xFungibleToken': '0x9a0766d93b6608b7',
    '0xHybridCustody': '0x294e44e1ec6993c6',
    '0xLockedTokens': '0x95e019a17d0e23d7',
    '0xMetadataViews': '0x631e88ae7f1d7c20',
    '0xNonFungibleToken': '0x631e88ae7f1d7c20',
    '0xStakingCollection': '0x95e019a17d0e23d7',
    '0xFlowStakingCollection': '0x95e019a17d0e23d7',
    '0xStakingProxy': '0x7aad92e5a0715d21',
    '0xSwapError': '0xddb929038d45d4b3',
    '0xSwapRouter': '0x2f8af5ed05bbde0d',
    '0xEVM': '0x8c5303eaa26202d6',
    '0xFlowEVMBridge': '0xdfc20aee650fcbdf',
    '0xCapabilityFilter': '0xd8a7e05a7ac670c0',
    '0xFlowEVMBridgeConfig': '0xdfc20aee650fcbdf',
  },
  sandboxnet: {
    '0xDomains': '0x8998b29311d1f3da',
    '0xFlowFees': '0xe92c2039bbe9da96',
    '0xFlowns': '0x8998b29311d1f3da',
    '0xFlowTableStaking': '0xf4527793ee68aede',
    '0xFlowToken': '0x0661ab7d6696a460',
    '0xFungibleToken': '0xe20612a0776ca4bf',
    '0xLockedTokens': '0xf4527793ee68aede',
    '0xNonFungibleToken': '0x83ade3a54eb3870c',
  },
};

const HOST_TESTNET = 'https://rest-testnet.onflow.org';
const HOST_MAINNET = 'https://rest-mainnet.onflow.org';

// NOTE: These are the currently the same hosts. TODO: figure out how to run both networks simultaneously.
export const EMULATOR_HOST_TESTNET = 'http://localhost:8888';
export const EMULATOR_HOST_MAINNET = 'http://localhost:8888';

// Fetch contracts from API and cache them
async function fetchContracts() {
  const ttl = 60 * 60 * 1000; // 1 hour in milliseconds
  try {
    // First, try to get the cached contracts
    const cachedContracts = await storage.getExpiry('contracts');

    if (cachedContracts) {
      return cachedContracts;
    }

    // If not cached or expired, fetch from the remote server
    const response = await fetch(CONTRACTS_URL);
    const data = await response.json();

    // Cache the fetched contracts for future use with expiry
    await storage.setExpiry('contracts', data, ttl);
    return data;
  } catch (error) {
    consoleError('Error fetching contracts:', error);

    // If fetching and cache both fail, return fallback contracts
    consoleWarn('Using fallback contract addresses.');
    return fallbackContracts;
  }
}

// Configure FCL for Mainnet
export const fclMainnetConfig = async (emulatorMode?: boolean) => {
  const contracts = await fetchContracts();
  const mainnetContracts = contracts.mainnet || fallbackContracts.mainnet;

  const host = !!emulatorMode ? EMULATOR_HOST_MAINNET : HOST_MAINNET;
  const config = fcl.config().put('accessNode.api', host).put('flow.network', 'mainnet');

  // Loop through all keys in mainnetContracts and apply them to the configuration
  for (const key in mainnetContracts) {
    if (Object.prototype.hasOwnProperty.call(mainnetContracts, key)) {
      config.put(key, mainnetContracts[key]);
    }
  }
};

// Configure FCL for Testnet
export const fclTestnetConfig = async (emulatorMode?: boolean) => {
  const contracts = await fetchContracts();
  const testnetContracts = contracts.testnet || fallbackContracts.testnet;

  const host = !!emulatorMode ? EMULATOR_HOST_TESTNET : HOST_TESTNET;
  const config = fcl.config().put('accessNode.api', host).put('flow.network', 'testnet');

  for (const key in testnetContracts) {
    if (Object.prototype.hasOwnProperty.call(testnetContracts, key)) {
      config.put(key, testnetContracts[key]);
    }
  }
};

export const fclConfig = async (network: FlowNetwork, emulatorMode?: boolean) => {
  if (network === 'testnet') {
    await fclTestnetConfig(emulatorMode);
  } else {
    // Default to mainnet
    await fclMainnetConfig(emulatorMode);
  }
};

export const fclEnsureNetwork = async (network: string) => {
  if (!isValidNetwork(network)) {
    throw new Error(`Invalid network: ${network}`);
  }
  const currentNetwork = await fcl.config().get('flow.network');
  if (currentNetwork !== network) {
    await fclConfig(network as FlowNetwork);
  }
};

export const fclConfirmNetwork = async (network: string) => {
  if (!isValidNetwork(network)) {
    throw new Error(`Invalid network: ${network}`);
  }
  const currentNetwork = await fcl.config().get('flow.network');
  return currentNetwork === network;
};
