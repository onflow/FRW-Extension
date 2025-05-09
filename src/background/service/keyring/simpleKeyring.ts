import { Wallet } from 'ethers';

import { normalizeAddress } from 'background/utils';

export type SimpleKeyringSerializedData = string[];
export type SimpleKeyPairType = 'Simple Key Pair';
export type SimpleKeyringData = {
  type: SimpleKeyPairType;
  data: SimpleKeyringSerializedData;
};
export class SimpleKeyring {
  static type: SimpleKeyPairType = 'Simple Key Pair';
  type: SimpleKeyPairType = 'Simple Key Pair';
  wallets: { privateKey: Buffer }[] = [];

  constructor(privateKeys?: string[]) {
    if (privateKeys?.length) {
      this.deserialize(privateKeys);
    }
  }

  async serialize(): Promise<SimpleKeyringSerializedData> {
    return this.wallets.map((w) => w.privateKey.toString('hex'));
  }

  async serializeWithType(): Promise<SimpleKeyringData> {
    return {
      type: this.type,
      data: await this.serialize(),
    };
  }

  async deserialize(privateKeys: SimpleKeyringSerializedData) {
    this.wallets = privateKeys.map((pk) => ({
      privateKey: Buffer.from(pk, 'hex'),
    }));
  }

  async addAccounts(n = 1) {
    const newAddresses: string[] = [];

    for (let i = 0; i < n; i++) {
      const wallet = Wallet.createRandom();
      this.wallets.push({
        privateKey: Buffer.from(wallet.privateKey.slice(2), 'hex'),
      });
      newAddresses.push(normalizeAddress(wallet.address));
    }

    return newAddresses;
  }

  async getAccounts() {
    return Promise.resolve(
      this.wallets.map((w) => {
        // Get the address from the private key
        const address = normalizeAddress(new Wallet(w.privateKey.toString('hex')).address);
        // replace the last 4 characters with 'XXXX' to make it an invalid address
        return address.slice(0, -4) + 'XXXX';
      })
    );
  }

  async removeAccount(address: string) {
    const normalizedAddress = normalizeAddress(address);
    const index = this.wallets.findIndex(
      (w) =>
        normalizeAddress(new Wallet(w.privateKey.toString('hex')).address) === normalizedAddress
    );
    if (index === -1) throw new Error('Address not found');
    this.wallets.splice(index, 1);
  }

  async removeAllAccounts() {
    this.wallets = [];
    return true;
  }

  private getWalletByAddress(address: string): Wallet {
    const normalizedAddress = normalizeAddress(address);
    const privateKey = this.wallets.find(
      (w) =>
        normalizeAddress(new Wallet(w.privateKey.toString('hex')).address) === normalizedAddress
    );
    if (!privateKey) throw new Error('Address not found');
    return new Wallet(privateKey.privateKey.toString('hex'));
  }

  async exportAccount(address: string): Promise<string> {
    return this.getWalletByAddress(address).privateKey;
  }

  async signTransaction(address: string, tx: any) {
    const wallet = this.getWalletByAddress(address);
    return wallet.signTransaction(tx);
  }

  async signMessage(address: string, data: string) {
    const wallet = this.getWalletByAddress(address);
    return wallet.signMessage(data);
  }

  async signPersonalMessage(address: string, data: string) {
    return this.signMessage(address, data);
  }

  async signTypedData(address: string, data: any, opts: { version: string } = { version: 'V1' }) {
    const wallet = this.getWalletByAddress(address);

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
    const wallet = this.getWalletByAddress(address);
    return wallet.signingKey.publicKey;
  }

  async decryptMessage(address: string, data: string) {
    const wallet = this.getWalletByAddress(address);
    // Todo: This is a placeholder. Implement actual message decryption logic
    throw new Error('Message decryption not implemented');
  }
}
