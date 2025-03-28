import HDWallet from 'ethereum-hdwallet';

import { type AccountKeyRequest } from '@/shared/types/network-types';
import { type FlowAddress, type EvmAddress } from '@/shared/types/wallet-types';

export function sansPrefix(address: string): FlowAddress | EvmAddress | null {
  if (!address) return null;
  return address.replace(/^0x/, '').replace(/^Fx/, '') as FlowAddress | EvmAddress;
}

export function withPrefix(address: string): FlowAddress | EvmAddress | null {
  if (!address) return null;
  return ('0x' + sansPrefix(address)) as FlowAddress | EvmAddress;
}

export function display(address) {
  return withPrefix(address);
}

export const getAccountKey = (mnemonic) => {
  const hdwallet = HDWallet.fromMnemonic(mnemonic);
  const publicKey = hdwallet.derive("m/44'/539'/0'/0/0").getPublicKey().toString('hex');
  const key: AccountKeyRequest = {
    hash_algo: 1,
    sign_algo: 2,
    weight: 1000,
    public_key: publicKey,
  };
  return key;
};

export const isValidEthereumAddress = (address): address is EvmAddress => {
  const regex = /^(0x)?[0-9a-fA-F]{40}$/;
  return regex.test(address);
};

export const isValidFlowAddress = (address): address is FlowAddress => {
  const regex = /^(0x)?[0-9a-fA-F]{16}$/;
  return regex.test(address);
};

export const isValidAddress = (address: unknown) => {
  return (
    typeof address === 'string' && (isValidEthereumAddress(address) || isValidFlowAddress(address))
  );
};

export const ensureEvmAddressPrefix = (address) => {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;

  const prefixedAddress = '0x' + cleanAddress;

  return prefixedAddress;
};

export const formatString = (str: string): string => {
  const addressString = ensureEvmAddressPrefix(str);
  if (!addressString || addressString.length < 16) return addressString; // Check if string is too short
  return `${addressString.substring(0, 6)}...${addressString.substring(addressString.length - 10)}`;
};
