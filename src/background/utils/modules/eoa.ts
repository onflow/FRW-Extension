import { ethers } from 'ethers';

import { ensureEvmAddressPrefix, isValidEthereumAddress } from '@/shared/utils/address';

/**
 * Derives an EOA address from a private key
 * @param privateKey - The private key in hex format
 * @returns The EOA address with 0x prefix
 */
export const deriveEoaAddress = (privateKey: string): string => {
  try {
    // Create a wallet instance from the private key
    const wallet = new ethers.Wallet(privateKey);
    // Get the address and ensure it has the 0x prefix
    const address = ensureEvmAddressPrefix(wallet.address.toLowerCase());

    // Validate the derived address
    if (!isValidEthereumAddress(address)) {
      throw new Error('Derived EOA address is invalid');
    }

    return address;
  } catch (error) {
    throw new Error(`Failed to derive EOA address: ${error.message}`);
  }
};

/**
 * Gets both COA and EOA addresses for a given private key
 * @param privateKey - The private key in hex format
 * @returns Object containing both COA and EOA addresses
 */
export const getAccountAddresses = (privateKey: string): { coa: string; eoa: string } => {
  const eoaAddress = deriveEoaAddress(privateKey);
  // For now, we'll use the same address for COA as we don't have the COA derivation logic yet
  // This should be updated once we have the COA derivation logic
  return {
    coa: eoaAddress,
    eoa: eoaAddress,
  };
};
