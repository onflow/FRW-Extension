import { type ActiveAccountType } from '@onflow/frw-shared/types';

export const TERMS_OF_SERVICE_URL =
  process.env.TERMS_OF_SERVICE_URL || 'https://wallet.flow.com/terms-of-service';
export const PRIVACY_POLICY_URL =
  process.env.PRIVACY_POLICY_URL || 'https://wallet.flow.com/privacy-policy';

export const SWAP_LINK_FLOW_MAINNET =
  process.env.SWAP_LINK_FLOW_MAINNET || 'https://app.increment.fi/swap';

export const SWAP_LINK_FLOW_TESTNET =
  process.env.SWAP_LINK_FLOW_TESTNET || 'https://demo.increment.fi/swap';

export const SWAP_LINK_EVM_MAINNET =
  process.env.SWAP_LINK_EVM_MAINNET || 'https://swap.kittypunch.xyz/swap';

export const SWAP_LINK_EVM_TESTNET =
  process.env.SWAP_LINK_EVM_TESTNET || 'https://swap.kittypunch.xyz/swap';

export const getSwapLink = (network: string, accountType: ActiveAccountType): string => {
  if (accountType === 'evm') {
    return network === 'mainnet' ? SWAP_LINK_EVM_MAINNET : SWAP_LINK_EVM_TESTNET;
  }
  return network === 'mainnet' ? SWAP_LINK_FLOW_MAINNET : SWAP_LINK_FLOW_TESTNET;
};
