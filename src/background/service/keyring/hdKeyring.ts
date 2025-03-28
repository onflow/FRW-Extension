import { ethers, HDNodeWallet } from 'ethers';

import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';

export class HDKeyring {
  static type = 'HD Key Tree';
  type = 'HD Key Tree';

  private hdWallet: HDNodeWallet | null = null;
  private mnemonic: string | null = null;
  private activeIndexes: number[] = [];
  private derivationPath: string = FLOW_BIP44_PATH;
  private passphrase: string = '';

  constructor(opts?: {
    mnemonic?: string;
    activeIndexes?: number[];
    derivationPath?: string;
    passphrase?: string;
  }) {
    if (opts?.mnemonic) {
      this.deserialize({
        mnemonic: opts.mnemonic,
        activeIndexes: opts.activeIndexes || [0],
        derivationPath: opts.derivationPath || FLOW_BIP44_PATH,
        passphrase: opts.passphrase || '',
      });
    }
  }

  async serialize() {
    return {
      mnemonic: this.hdWallet?.mnemonic?.phrase || this.mnemonic,
      activeIndexes: this.activeIndexes,
      publicKey: this.hdWallet?.publicKey || null,
      derivationPath: this.derivationPath,
      passphrase: this.passphrase,
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

  async removeAccount(address: string) {
    throw new Error('Operation not supported');
  }

  async exportAccount(address: string): Promise<string> {
    const wallet = this.hdWallet?.derivePath(`m/44'/539'/0'/0/${address}`);
    if (!wallet) throw new Error('Address not found');
    return wallet.privateKey;
  }

  async signTransaction(address: string, tx: any) {
    const wallet = this.hdWallet?.derivePath(`m/44'/539'/0'/0/${address}`);
    if (!wallet) throw new Error('Address not found');
    return wallet.signTransaction(tx);
  }

  async signMessage(address: string, data: string) {
    const wallet = this.hdWallet?.derivePath(`m/44'/539'/0'/0/${address}`);
    if (!wallet) throw new Error('Address not found');
    return wallet.signMessage(data);
  }

  async signPersonalMessage(address: string, data: string) {
    return this.signMessage(address, data);
  }

  async signTypedData(address: string, data: any, opts: { version: string } = { version: 'V1' }) {
    const wallet = this.hdWallet?.derivePath(`m/44'/539'/0'/0/${address}`);
    if (!wallet) throw new Error('Address not found');

    switch (opts.version) {
      case 'V1':
        return wallet.signTypedData(data.domain || {}, data.types || {}, data.message || {});
      case 'V3':
        return wallet.signTypedData(data.domain || {}, data.types || {}, data.message || {});
      case 'V4':
        return wallet.signTypedData(data.domain || {}, data.types || {}, data.message || {});
      default:
        throw new Error(`Unsupported typed data version: ${opts.version}`);
    }
  }

  async getEncryptionPublicKey(address: string) {
    const wallet = this.hdWallet?.derivePath(`m/44'/539'/0'/0/${address}`);
    if (!wallet) throw new Error('Address not found');
    return wallet.signingKey.publicKey;
  }

  async decryptMessage(address: string, data: string) {
    const wallet = this.hdWallet?.derivePath(`m/44'/539'/0'/0/${address}`);
    if (!wallet) throw new Error('Address not found');
    // Todo: This is a placeholder. Implement actual message decryption logic
    throw new Error('Message decryption not implemented');
  }

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
