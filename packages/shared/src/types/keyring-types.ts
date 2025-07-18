export type VaultEntryV2 = {
  id: string;
  encryptedData: string;
};

export type KeyringStateV2 = {
  booted: string;
  vault: VaultEntryV2[];
  vaultVersion: 1 | 2;
};

export type VaultEntryV3 = {
  id: string;
  publicKey: string;
  signAlgo: number;
  encryptedData: string;
};

export type KeyringStateV3 = {
  booted: string;
  vault: VaultEntryV3[];
  vaultVersion: 3;
};

export type KeyringState = KeyringStateV2 | KeyringStateV3;

export const KEYRING_STATE_V1_KEY = 'keyringState';
export const KEYRING_STATE_V2_KEY = 'keyringStateV2';
export const KEYRING_STATE_V3_KEY = 'keyringStateV3';

export const KEYRING_DEEP_VAULT_KEY = 'deepVault';

export const KEYRING_STATE_CURRENT_KEY = KEYRING_STATE_V3_KEY;
export const KEYRING_STATE_VAULT_V1 = 1;
export const KEYRING_STATE_VAULT_V2 = 2;
export const KEYRING_STATE_VAULT_V3 = 3;

export const CURRENT_ID_KEY = 'currentId';

export const KEYRING_TYPE = {
  HdKeyring: 'HD Key Tree',
  SimpleKeyring: 'Simple Key Pair',
  HardwareKeyring: 'hardware',
  WatchAddressKeyring: 'Watch Address',
  WalletConnectKeyring: 'WalletConnect',
  GnosisKeyring: 'Gnosis',
};
export const KEYRING_CLASS = {
  PRIVATE_KEY: 'Simple Key Pair',
  MNEMONIC: 'HD Key Tree',
  HARDWARE: {
    TREZOR: 'Trezor Hardware',
    LEDGER: 'Ledger Hardware',
    ONEKEY: 'Onekey Hardware',
    GRIDPLUS: 'GridPlus Hardware',
  },
  WATCH: 'Watch Address',
  WALLETCONNECT: 'WalletConnect',
  GNOSIS: 'Gnosis',
};
