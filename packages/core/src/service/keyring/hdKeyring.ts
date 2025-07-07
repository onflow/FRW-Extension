import { ethers, HDNodeWallet } from 'ethers';

import { FLOW_BIP44_PATH } from '@onflow/flow-wallet-shared/constant/algo-constants';

export type HDKeyringSerializedData = {
  mnemonic?: string;
  activeIndexes: number[];
  publicKey?: string;
  derivationPath: string;
  passphrase: string;
};
export type HDKeyringType = 'HD Key Tree';

export type HDKeyringData = {
  type: HDKeyringType;
  data: HDKeyringSerializedData;
};

export class HDKeyring {
  static type: HDKeyringType = 'HD Key Tree';
  type: HDKeyringType = 'HD Key Tree';

  private hdWallet: HDNodeWallet | null = null;
  private mnemonic: string | undefined = undefined;
  private activeIndexes: number[] = [];
  private derivationPath: string = FLOW_BIP44_PATH;
  private passphrase: string = '';

  constructor(opts?: HDKeyringSerializedData) {
    if (opts?.mnemonic) {
      this.deserialize({
        mnemonic: opts.mnemonic,
        activeIndexes: opts.activeIndexes || [0],
        derivationPath: opts.derivationPath || FLOW_BIP44_PATH,
        passphrase: opts.passphrase || '',
      });
    }
  }

  async serialize(): Promise<HDKeyringSerializedData> {
    return {
      mnemonic: this.hdWallet?.mnemonic?.phrase || this.mnemonic,
      activeIndexes: this.activeIndexes,
      publicKey: this.hdWallet?.publicKey,
      derivationPath: this.derivationPath,
      passphrase: this.passphrase,
    };
  }

  async serializeWithType(): Promise<HDKeyringData> {
    return {
      type: this.type,
      data: await this.serialize(),
    };
  }

  async deserialize(opts: {
    mnemonic: string;
    activeIndexes: number[];
    derivationPath: string;
    passphrase: string;
  }) {
    this.mnemonic = opts.mnemonic;
    // Create base wallet from mnemonic only
    this.hdWallet = HDNodeWallet.fromPhrase(opts.mnemonic);
    // Store active indexes
    this.activeIndexes = opts.activeIndexes?.length ? opts.activeIndexes : [0];
    // Store derivation path
    this.derivationPath = opts.derivationPath;
    // Store passphrase
    this.passphrase = opts.passphrase;
  }

  async addAccounts(numberOfAccounts = 1) {
    // No need to add accounts
    throw new Error('Operation not supported');
  }

  async getMnemonic() {
    if (!this.mnemonic) {
      throw new Error('Mnemonic is required');
    }
    return [this.mnemonic];
  }

  /**
   * @deprecated Do not use this method. It returns a dummy address that is an EOA address and not a real account that the user has, but it is a unique identifier for the wallet
   */
  async getAccounts() {
    if (!this.hdWallet) {
      throw new Error('HD Wallet is required');
    }
    // Get the dummy eth address. This isn't a real account that the user has, but it is a unique identifier for the wallet
    const hdWalletEthAddress = await this.hdWallet.getAddress();
    // replace the last 4 characters with 'XXXX' to make it an invalid address
    const uniqueButInvalidAddress = hdWalletEthAddress.slice(0, -4) + 'XXXX';
    return [uniqueButInvalidAddress];
  }
  /**
   * @deprecated Do not use this method. It returns a dummy address that is an EOA address and not a real account that the user has, but it is a unique identifier for the wallet
   */
  async removeAccount(address: string) {
    throw new Error('Operation not supported');
  }
  /**
   * @deprecated Do not use this method. It returns a dummy address that is an EOA address and not a real account that the user has, but it is a unique identifier for the wallet
   */
  async removeAllAccounts() {
    this.hdWallet = null;
    this.mnemonic = undefined;
    this.activeIndexes = [];
    return true;
  }

  /**
   * @deprecated Do not use this method. It returns a dummy address that is an EOA address and not a real account that the user has, but it is a unique identifier for the wallet
   */

  async _getPrivateKey(index: number): Promise<any> {
    try {
      if (!this.mnemonic) {
        throw new Error('Mnemonic is required');
      }
      const mnemonic = ethers.Mnemonic.fromPhrase(this.mnemonic);
      // Create base HD node first, then derive the Flow path
      const baseNode = ethers.HDNodeWallet.fromMnemonic(mnemonic);
      const flowPath = `m/44'/539'/0'/0/${index}`;
      const hdNode = baseNode.derivePath(flowPath);
      return hdNode.privateKey;
    } catch (err) {
      throw new Error(`Failed to derive private key: ${err.message}`);
    }
  }
}
