import * as secp from '@noble/secp256k1';
import * as fcl from '@onflow/fcl';

import { signMessageHash } from '@/background/utils/modules/publicPrivateKey';
import wallet from 'background/controller/wallet';
import { keyringService, openapiService } from 'background/service';
import { createPersistStore } from 'background/utils';

import { storage } from '../webapi';

export interface FlownsStore {
  mainnet: boolean;
  testnet: boolean;
  newInbox: newInbox;
  inboxHistory: history;
}

interface newInbox {
  mainnet: number;
  testnet: number;
}

interface history {
  mainnet: tokenGroup;
  testnet: tokenGroup;
}

interface tokenGroup {
  token: string[];
  nft: Record<string, unknown>;
}

const template = {
  mainnet: true,
  testnet: true,
  inboxHistory: {
    mainnet: {
      token: [],
      nft: {},
    },
    testnet: {
      token: [],
      nft: {},
    },
  },
  newInbox: {
    mainnet: 0,
    testnet: 0,
  },
};

class Flowns {
  store!: FlownsStore;

  init = async () => {
    this.store = await createPersistStore<FlownsStore>({
      name: 'flowns',
      template: template,
    });
  };

  flownsAddr = '';

  setPop = (network: string, status: boolean) => {
    this.store[network] = status;
  };

  getPop = (network: string) => {
    return this.store[network];
  };

  setHistory = (network: string, data) => {
    this.store.inboxHistory[network] = data;
  };

  getHistory = (network: string) => {
    return this.store.inboxHistory[network];
  };

  setNewInbox = (network: string, data) => {
    this.store.newInbox[network] = data;
  };

  getNewInbox = (network: string) => {
    return this.store.newInbox[network];
  };

  // sendTransaction = async (
  //   cadence: string,
  //   domainName: string,
  //   flownsAddress: string,
  //   lilicoAddress: string
  // ): Promise<string> => {
  //   this.flownsAddr = flownsAddress;
  //   const walletAddress = await wallet.getCurrentAddress();
  //   // TODO: FIX ME
  //   const walletKeyIndex = 0;
  //   const account = await fcl.send([fcl.getAccount(walletAddress!)]).then(fcl.decode);
  //   const latestSealedBlock = await fcl.send([fcl.getBlock(true)]).then(fcl.decode);

  //   const refBlock = latestSealedBlock.id;
  //   const sequenceNum = account.keys[walletKeyIndex].sequenceNumber;

  //   const payer = await wallet.getPayerAddressAndKeyId();
  //   const payerAddress = fcl.withPrefix(payer.address);
  //   const lilicAccount = lilicoAddress;
  //   const payloadSigsArray: any[] = [];

  //   const tx = {
  //     cadence,
  //     refBlock,
  //     arguments: [
  //       {
  //         type: 'String',
  //         value: domainName,
  //       },
  //     ],
  //     proposalKey: {
  //       address: walletAddress,
  //       keyId: walletKeyIndex,
  //       sequenceNum: sequenceNum,
  //     },
  //     payer: payerAddress,
  //     payloadSigs: payloadSigsArray,
  //     authorizers: [walletAddress, lilicAccount, flownsAddress],
  //     computeLimit: '9999',
  //   };
  //   const message = sdk.encodeTransactionPayload(tx);
  //   const signature = await this.sign(message);
  //   const userSigs = {
  //     address: walletAddress,
  //     keyId: walletKeyIndex,
  //     sig: signature,
  //   };

  //   tx.payloadSigs.push(userSigs);
  //   const messagePayload = sdk.encodeTransactionPayload(tx);
  //   const response = await openapiService.flownsTransaction(tx, messagePayload);

  //   return response.data;
  // };

  sign = async (signableMessage: string): Promise<string> => {
    const hashAlgo = await storage.get('hashAlgo');

    const messageHash = await signMessageHash(hashAlgo, Buffer.from(signableMessage, 'hex'));

    const password = keyringService.password;
    const privateKey = await wallet.getPrivateKeyForCurrentAccount(password);
    const signature = await secp.sign(messageHash, privateKey);
    const realSignature = secp.Signature.fromHex(signature).toCompactHex();
    return realSignature;
  };

  authorizationFunction = async (account: any = {}) => {
    // authorization function need to return an account
    const address = fcl.withPrefix(await wallet.getCurrentAddress());
    const ADDRESS = fcl.withPrefix(address);

    // TODO: FIX THIS

    const KEY_ID = 0;
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: await this.sign(signable.message), // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };

  signPayer = async (signable: any): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;

    const envelope = await openapiService.flownsTransaction(tx, message);

    const signature = envelope.data.transaction.envelopeSigs[0].sig;
    // const signatureByte = Buffer.from(signature, 'base64')
    const signatureHex = signature.toString('hex');
    return signatureHex;
  };

  payerAuthFunction = async (account: any = {}) => {
    // authorization function need to return an account
    const payer = await wallet.getPayerAddressAndKeyId();
    const address = fcl.withPrefix(payer.address);
    const ADDRESS = fcl.withPrefix(address);

    // TODO: FIX THIS
    const KEY_ID = payer.keyId;

    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        const signature = await this.signPayer(signable);
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: signature, // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };

  signAuth = async (signable: any): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;

    const envelope = await openapiService.flownsAuthTransaction(tx, message);
    const sigArray = envelope.data.transaction.payloadSigs;
    const signature = sigArray[sigArray.length - 1].sig;

    // const signatureByte = Buffer.from(signature, 'base64')
    const signatureHex = signature.toString('hex');
    return signatureHex;
  };

  flownsAuthFunction = async (account: any = {}) => {
    // authorization function need to return an account
    const address = fcl.withPrefix(this.flownsAddr);
    const ADDRESS = fcl.withPrefix(address);

    // TODO: FIX THIS
    const KEY_ID = 0;
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        const signature = await this.signAuth(signable);
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: signature, // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };
}

export default new Flowns();
