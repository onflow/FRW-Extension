import BigNumber from 'bignumber.js';
import { ethErrors } from 'eth-rpc-errors';
import { intToHex, isHexString } from 'ethereumjs-util';
import { ethers } from 'ethers';
import RLP from 'rlp';
import Web3 from 'web3';
import { stringToHex } from 'web3-utils';

import { EVM_ENDPOINT } from '@onflow/flow-wallet-shared/constant/domain-constants';
import { tupleToPrivateKey } from '@onflow/flow-wallet-shared/types/key-types';
import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from '@onflow/flow-wallet-shared/types/network-types';
import {
  ensureEvmAddressPrefix,
  isValidEthereumAddress,
} from '@onflow/flow-wallet-shared/utils/address';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import BaseController from '@/background/controller/base';
import Wallet from '@/background/controller/wallet';
import {
  keyringService,
  permissionService,
  sessionService,
  signTextHistoryService,
} from '@/core/service';
import { getAccountsByPublicKeyTuple } from '@/core/utils/modules/findAddressWithPubKey';
import { signWithKey } from '@/core/utils/modules/publicPrivateKey';

import notificationService from '../notification';

interface Web3WalletPermission {
  // The name of the method corresponding to the permission
  parentCapability: string;

  // The date the permission was granted, in UNIX epoch time
  date?: number;
}

interface COAOwnershipProof {
  keyIndices: bigint[];
  address: Uint8Array;
  capabilityPath: string;
  signatures: Uint8Array[];
}

function removeHexPrefix(hexString: string): string {
  return hexString.startsWith('0x') ? hexString.substring(2) : hexString;
}
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createAndEncodeCOAOwnershipProof(
  keyIndices: bigint[],
  address: Uint8Array,
  capabilityPath: string,
  signatures: Uint8Array[]
): Uint8Array {
  const proof: COAOwnershipProof = {
    keyIndices,
    address,
    capabilityPath,
    signatures,
  };
  const encodedData = RLP.encode([
    keyIndices,
    proof.address,
    Buffer.from(proof.capabilityPath, 'utf8'),
    proof.signatures,
  ]);

  return encodedData; // Convert the encoded data to a hexadecimal string for easy display or transmission
}

/**
 * Gets the matching account and signing information for the current wallet
 * @returns Object containing account details and signing information
 */
async function getSigningDetailsForCurrentWallet() {
  const network = await Wallet.getNetwork();
  const privateKeyTuple = await keyringService.getCurrentPublicPrivateKeyTuple();

  // Find any account with public key information
  const accounts = await getAccountsByPublicKeyTuple(privateKeyTuple, network);

  const addressHex = await Wallet.getParentAddress();
  const matchingAccount = accounts.find((account) => account.address === addressHex);

  if (!matchingAccount) {
    throw new Error('Current wallet not found in accounts');
  }

  // Get the private key from the private key tuple
  const privateKey = tupleToPrivateKey(privateKeyTuple, matchingAccount.signAlgo);
  const hashAlgo = matchingAccount.hashAlgo;
  const signAlgo = matchingAccount.signAlgo;
  const keyIndex = matchingAccount.keyIndex;

  return {
    addressHex,
    privateKey,
    hashAlgo,
    signAlgo,
    keyIndex,
  };
}

/**
 * Common signing logic used by both message and typed data signing
 * @param dataToSign The prepared data to sign
 * @returns The encoded proof as a hex string
 */
async function createSignatureProof(dataToSign: string) {
  if (!(await Wallet.isUnlocked())) {
    throw new Error('Wallet is locked');
  }

  const rightPaddedHexBuffer = (value: string, pad: number) =>
    Buffer.from(value.padEnd(pad * 2, '0'), 'hex');

  const USER_DOMAIN_TAG = rightPaddedHexBuffer(
    Buffer.from('FLOW-V0.0-user').toString('hex'),
    32
  ).toString('hex');

  const prependUserDomainTag = (msg: string) => USER_DOMAIN_TAG + msg;
  const signableData = prependUserDomainTag(removeHexPrefix(dataToSign));

  // Retrieve the private key from the wallet
  const { addressHex, privateKey, hashAlgo, signAlgo, keyIndex } =
    await getSigningDetailsForCurrentWallet();
  if (!addressHex) {
    throw new Error('Current wallet not found');
  }

  const signature = await signWithKey(signableData, signAlgo, hashAlgo, privateKey);

  const addressBuffer = Buffer.from(addressHex.slice(2), 'hex');
  const addressArray = Uint8Array.from(addressBuffer);

  const encodedProof = createAndEncodeCOAOwnershipProof([BigInt(keyIndex)], addressArray, 'evm', [
    Uint8Array.from(Buffer.from(signature, 'hex')),
  ]);

  return '0x' + toHexString(encodedProof);
}

async function signMessage(msgParams, opts = {}) {
  const web3 = new Web3();
  const textData = msgParams.data;
  const hashedData = web3.eth.accounts.hashMessage(textData);

  return createSignatureProof(hashedData);
}

async function signTypeData(msgParams, opts = {}) {
  const hashedData = Buffer.from(msgParams).toString('hex');

  return createSignatureProof(hashedData);
}

const SignTypedDataVersion = {
  V1: 'V1',
  V3: 'V3',
  V4: 'V4',
} as const;

export const TypedDataUtils = {
  eip712Hash(message: any, version: string): Buffer {
    const types = { ...message.types };
    delete types.EIP712Domain;

    const primaryType = message.primaryType || 'OrderComponents';

    const encoder = new ethers.TypedDataEncoder({
      [primaryType]: types[primaryType],
      ...types,
    });

    const domainSeparator = ethers.TypedDataEncoder.hashDomain(message.domain);
    const hashStruct = encoder.hash(message.message);

    const encodedData = ethers.concat([
      Buffer.from('1901', 'hex'),
      Buffer.from(domainSeparator.slice(2), 'hex'),
      Buffer.from(hashStruct.slice(2), 'hex'),
    ]);

    return Buffer.from(ethers.keccak256(encodedData).slice(2), 'hex');
  },
};

class ProviderController extends BaseController {
  ethRpc = async (data): Promise<any> => {
    const network = await Wallet.getNetwork(); // Get the current network
    const provider = new Web3.providers.HttpProvider(EVM_ENDPOINT[network]);
    const web3Instance = new Web3(provider);

    return new Promise((resolve, reject) => {
      if (!web3Instance.currentProvider) {
        consoleError('Provider is undefined');
        return;
      }

      web3Instance.currentProvider.send(
        {
          jsonrpc: '2.0',
          method: data.method,
          params: data.params,
          id: new Date().getTime(),
        },
        (err, response) => {
          if (err) {
            consoleError('Error:', err);
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  };

  ethRequestAccounts = async ({ session: { origin, name, icon } }) => {
    if (!permissionService.hasPermission(origin) || !(await Wallet.isUnlocked())) {
      const { defaultChain, signPermission } = await notificationService.requestApproval(
        {
          params: { origin, name, icon },
          approvalComponent: 'EthConnect',
        },
        { height: 599 }
      );
      permissionService.addConnectedSite(origin, name, icon, defaultChain);
    }

    const currentWallet = await Wallet.getParentAddress();
    let evmAddress;

    if (!currentWallet) {
      throw new Error('Current wallet not found');
    }
    try {
      // Attempt to query the EVM address
      evmAddress = await Wallet.queryEvmAddress(currentWallet);
      if (!isValidEthereumAddress(evmAddress)) {
        throw new Error('Invalid EVM address');
      }
    } catch (error) {
      // If an error occurs, request approval
      consoleError('ethRequestAccounts - Error querying EVM address:', error);

      await notificationService.requestApproval(
        {
          params: { origin, name, icon },
          approvalComponent: 'EthConnect',
        },
        { height: 599 }
      );
      evmAddress = await Wallet.queryEvmAddress(currentWallet);
      if (!isValidEthereumAddress(evmAddress)) {
        throw new Error('Invalid EVM address');
      }
    }

    const account = evmAddress ? [ensureEvmAddressPrefix(evmAddress)] : [];

    sessionService.broadcastEvent('accountsChanged', account);
    return account;
  };

  ethEstimateGas = async ({ data }) => {
    const network = await Wallet.getNetwork();
    const url = EVM_ENDPOINT[network];
    const provider = new ethers.JsonRpcProvider(url);
    const gas = await provider.estimateGas({
      from: data.params[0].from,
      // Wrapped ETH address
      to: data.params[0].to,
      gasPrice: data.params[0].gasPrice,
      data: data.params[0].data,
      // 1 ether
      value: data.params[0].value,
    });
    return '0x' + gas.toString(16);
  };

  ethSendTransaction = async (data) => {
    if (!data || !data.data || !data.data.params || !data.data.params.length) {
      consoleError('Invalid data structure');
      return null;
    }

    // Accessing the first item in 'params' array
    const transactionParams = data.data.params[0];

    // Extracting individual parameters
    const from = transactionParams.from || '';
    const to = transactionParams.to || '';
    const value = transactionParams.value || '0x0';
    const dataValue = transactionParams.data || '0x';
    const gas = transactionParams.gas || '0x1C9C380';
    const cleanHex = gas.startsWith('0x') ? gas : `0x${gas}`;
    const gasBigInt = BigInt(cleanHex);

    let result = await Wallet.dapSendEvmTX(to, gasBigInt, value, dataValue);
    if (!result) {
      throw new Error('Transaction hash is null or undefined');
    }
    if (!result.startsWith('0x')) {
      result = '0x' + result;
    }
    return result;
  };

  ethAccounts = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin) || !(await Wallet.isUnlocked())) {
      return [];
    }

    let currentWallet;
    try {
      // Attempt to query the currentNetwork address
      currentWallet = await Wallet.getParentAddress();
    } catch (error) {
      // If an error occurs, request approval
      consoleError('Error querying EVM address:', error);

      return;
    }

    let evmAccount: string | null = null;
    try {
      // Attempt to query the EVM address
      evmAccount = await Wallet.queryEvmAddress(currentWallet);
    } catch (error) {
      // If an error occurs, request approval
      consoleError('Error querying EVM address:', error);
    }

    const account = evmAccount ? [evmAccount.toLowerCase()] : [];
    try {
      await sessionService.broadcastEvent('accountsChanged', account);
    } catch (error) {
      consoleError('Error broadcasting accountsChanged event:', error);
      // Continue despite the error
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    await delay(200);

    return account;
  };

  walletRequestPermissions = ({ data: { params: permissions } }) => {
    const result: Web3WalletPermission[] = [];
    if (permissions && 'eth_accounts' in permissions[0]) {
      result.push({ parentCapability: 'eth_accounts' });
    }
    return result;
  };

  walletRevokePermissions = async ({ session: { origin }, data: { params } }) => {
    const isUnlocked = await Wallet.isUnlocked();
    if (isUnlocked && Wallet.getConnectedSite(origin)) {
      if (params?.[0] && 'eth_accounts' in params[0]) {
        Wallet.removeConnectedSite(origin);
      }
    }
    return null;
  };

  walletWatchAsset = async ({ data }) => {
    const result = await notificationService.requestApproval(
      {
        params: { data },
        approvalComponent: 'EthSuggest',
      },
      { height: 599 }
    );
    return result;
  };

  walletSwitchEthereumChain = async ({
    data: {
      params: [chainParams],
    },
    session: { origin },
  }) => {
    let chainId = chainParams.chainId;
    const network = await Wallet.getNetwork();
    if (typeof chainId === 'number') {
      chainId = intToHex(chainId).toLowerCase();
    } else {
      chainId = `0x${new BigNumber(chainId).toString(16).toLowerCase()}`;
    }

    switch (chainId) {
      case '0x221': // 545 in decimal corresponds to testnet
        if (network !== 'testnet') {
          await notificationService.requestApproval(
            {
              params: { origin, target: 'testnet' },
              approvalComponent: 'EthSwitch',
            },
            { height: 599 }
          );
        }
        return null;

      case '0x2eb': // 747 in decimal corresponds to mainnet
        if (network !== 'mainnet') {
          await notificationService.requestApproval(
            {
              params: { origin, target: 'mainnet' },
              approvalComponent: 'EthSwitch',
            },
            { height: 599 }
          );
        }
        return null;
      default:
        throw ethErrors.provider.custom({
          code: 4902,
          message: `Unrecognized  ChainId"${chainId}".`,
        });
    }
  };

  // Should not be in controller
  personalSign = async ({ data, approvalRes, session }) => {
    if (!data.params) return;
    const [string, from] = data.params;
    const hex = isHexString(string) ? string : stringToHex(string);
    const result = await signMessage({ data: hex, from }, approvalRes?.extra);
    signTextHistoryService.createHistory({
      address: from,
      text: string,
      origin: session.origin,
      type: 'personalSign',
    });
    return result;
  };

  ethChainId = async ({ session }) => {
    const network = await Wallet.getNetwork();
    if (network === 'testnet') {
      return TESTNET_CHAIN_ID;
    } else {
      return MAINNET_CHAIN_ID;
    }
  };

  signTypeData = async (request) => {
    let address;
    let data;
    let currentChain;

    await notificationService.requestApproval(
      {
        params: request,
        approvalComponent: 'EthSignType',
      },
      { height: 599 }
    );

    const network = await Wallet.getNetwork();
    const currentWallet = await Wallet.getParentAddress();
    if (!currentWallet) {
      throw new Error('Current wallet not found');
    }
    const evmaddress = await Wallet.queryEvmAddress(currentWallet);

    if (network === 'testnet') {
      currentChain = TESTNET_CHAIN_ID;
    } else {
      currentChain = MAINNET_CHAIN_ID;
    }

    const paramAddress = request.data.params?.[0] || '';
    if (isValidEthereumAddress(paramAddress)) {
      data = request.data.params[1];
      address = request.data.params[0];
    } else {
      data = request.data.params[0];
      address = request.data.params[1];
    }

    let message;
    try {
      message = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      throw new Error('Invalid JSON data provided');
    }
    const { chainId } = message.domain || {};

    if (!chainId || Number(chainId) !== Number(currentChain)) {
      throw new Error('Provided chainId does not match the currently active chain');
    }

    // Potentially shouldn't change the case to compare - we should be checking ERC-55 conformity
    if (
      ensureEvmAddressPrefix(evmaddress!.toLowerCase()) !==
      ensureEvmAddressPrefix(address.toLowerCase())
    ) {
      throw new Error('Provided address does not match the current address');
    }

    const signTypeMethod =
      request.data.method === 'eth_signTypedData_v3'
        ? SignTypedDataVersion.V3
        : SignTypedDataVersion.V4;

    const hash = TypedDataUtils.eip712Hash(message, signTypeMethod);

    const result = await signTypeData(hash);
    signTextHistoryService.createHistory({
      address: address,
      text: data,
      origin: request.session.origin,
      type: 'ethSignTypedDataV4',
    });
    return result;
  };

  signTypeDataV1 = async (request) => {
    let address;
    let data;
    let currentChain;

    await notificationService.requestApproval(
      {
        params: request,
        approvalComponent: 'EthSignV1',
      },
      { height: 599 }
    );

    const network = await Wallet.getNetwork();
    const currentWallet = await Wallet.getParentAddress();
    if (!currentWallet) {
      throw new Error('Current wallet not found');
    }
    const evmaddress = await Wallet.queryEvmAddress(currentWallet);

    if (network === 'testnet') {
      currentChain = TESTNET_CHAIN_ID;
    } else {
      currentChain = MAINNET_CHAIN_ID;
    }

    const paramAddress = request.data.params?.[0] ? request.data.params?.[0] : '';

    if (isValidEthereumAddress(paramAddress)) {
      data = request.data.params[1];
      address = request.data.params[0];
    } else {
      data = request.data.params[0];
      address = request.data.params[1];
    }

    let message;
    try {
      message = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      throw new Error('Invalid JSON data provided');
    }
    const { chainId } = message.domain || {};

    if (!chainId || Number(chainId) !== Number(currentChain)) {
      throw new Error('Provided chainId does not match the currently active chain');
    }

    // Potentially shouldn't change the case to compare - we should be checking ERC-55 conformity
    if (
      ensureEvmAddressPrefix(evmaddress!.toLowerCase()) !==
      ensureEvmAddressPrefix(address.toLowerCase())
    ) {
      throw new Error('Provided address does not match the current address');
    }

    const hash = TypedDataUtils.eip712Hash(message, SignTypedDataVersion.V4);

    const result = await signTypeData(hash);
    signTextHistoryService.createHistory({
      address: address,
      text: data,
      origin: request.session.origin,
      type: 'ethSignTypedDataV1',
    });
    return result;
  };

  ethGetTransactionByHash = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethGetBalance = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethGetCode = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethGasPrice = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethBlockNumber = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethCall = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethGetTransactionReceipt = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result;
  };

  ethSignTypedData = async (request) => {
    const result = await this.signTypeDataV1(request);
    return result;
  };

  ethSignTypedDataV3 = async (request) => {
    const result = await this.signTypeData(request);
    return result;
  };

  ethSignTypedDataV4 = async (request) => {
    const result = await this.signTypeData(request);
    return result;
  };
}

export default new ProviderController();
