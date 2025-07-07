import * as fcl from '@onflow/fcl';

import { isValidNetwork, type FlowNetwork } from '@onflow/flow-wallet-shared/types/network-types';

const HOST_TESTNET = 'https://rest-testnet.onflow.org';
const HOST_MAINNET = 'https://rest-mainnet.onflow.org';

// NOTE: These are the currently the same hosts. TODO: figure out how to run both networks simultaneously.
export const EMULATOR_HOST_TESTNET = 'http://localhost:8888';
export const EMULATOR_HOST_MAINNET = 'http://localhost:8888';

// Configure FCL for Mainnet
export const fclMainnetConfig = async (emulatorMode?: boolean) => {
  const host = !!emulatorMode ? EMULATOR_HOST_MAINNET : HOST_MAINNET;
  fcl.config().put('accessNode.api', host).put('flow.network', 'mainnet');
};

// Configure FCL for Testnet
export const fclTestnetConfig = async (emulatorMode?: boolean) => {
  const host = !!emulatorMode ? EMULATOR_HOST_TESTNET : HOST_TESTNET;
  fcl.config().put('accessNode.api', host).put('flow.network', 'testnet');
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
