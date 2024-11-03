import { ethErrors } from 'eth-rpc-errors';

// import RpcCache from 'background/utils/rpcCache';
import {
  permissionService,
  preferenceService,
  sessionService,
  signTextHistoryService,
  keyringService,
  notificationService,
} from 'background/service';
import Wallet from '../wallet';
import BaseController from '../base';
import { EVM_ENDPOINT } from 'consts';
import { stringToHex } from 'web3-utils';
import {
  normalize as normalizeAddress,
} from 'eth-sig-util';
import { ethers } from 'ethers';
import { isHexString, intToHex } from 'ethereumjs-util';
import BigNumber from 'bignumber.js';
import RLP from 'rlp';
import Web3 from 'web3';
import { signWithKey } from '@/ui/utils/modules/passkey.js';
import {
  ensureEvmAddressPrefix,
  isValidEthereumAddress
} from '@/ui/utils/address';
import { storage } from '../../webapi';
import { TypedDataUtils, SignTypedDataVersion } from "@metamask/eth-sig-util";
import * as fcl from '@onflow/fcl';

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

const v1SignTypedDataVlidation = ({
  data: {
    params: [_, from],
  },
}) => {
  const currentAddress = preferenceService
    .getCurrentAccount()
    ?.address.toLowerCase();
  if (from.toLowerCase() !== currentAddress)
    throw ethErrors.rpc.invalidParams('from should be same as current address');
};

const signTypedDataVlidation = ({
  data: {
    params: [from, _],
  },
}) => {
  const currentAddress = preferenceService
    .getCurrentAccount()
    ?.address.toLowerCase();
  if (from.toLowerCase() !== currentAddress)
    throw ethErrors.rpc.invalidParams('from should be same as current address');
};

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

async function signMessage(msgParams, opts = {}) {
  const web3 = new Web3();
  const textData = msgParams.data;

  const rightPaddedHexBuffer = (value: string, pad: number) =>
    Buffer.from(value.padEnd(pad * 2, '0'), 'hex');
  const hashedData = web3.eth.accounts.hashMessage(textData);

  const USER_DOMAIN_TAG = rightPaddedHexBuffer(
    Buffer.from('FLOW-V0.0-user').toString('hex'),
    32
  ).toString('hex');

  const prependUserDomainTag = (msg: string) => USER_DOMAIN_TAG + msg;
  const signableData = prependUserDomainTag(removeHexPrefix(hashedData));

  // Retrieve the private key from the wallet (assuming Ethereum wallet)
  const password = keyringService.password;
  const privateKey = await Wallet.getKey(password);
  const currentWallet = await Wallet.getMainWallet();
  const account = await fcl.account(currentWallet);
  const hashAlgo = await storage.get('hashAlgo');
  const signAlgo = await storage.get('signAlgo');
  const keyindex = await storage.get('keyIndex');
  console.log('keyindex ', [BigInt(keyindex)], account)
  // const wallet = new ethers.Wallet(privateKey);
  const signature = await signWithKey(
    signableData,
    signAlgo,
    hashAlgo,
    privateKey
  );

  const addressHex = currentWallet;
  const addressBuffer = Buffer.from(addressHex.slice(2), 'hex');
  const addressArray = Uint8Array.from(addressBuffer);

  const encodedProof = createAndEncodeCOAOwnershipProof(
    [BigInt(keyindex)],
    addressArray,
    'evm',
    [Uint8Array.from(Buffer.from(signature, 'hex'))]
  );

  return '0x' + toHexString(encodedProof);
}

async function signTypeData(msgParams, opts = {}) {

  const rightPaddedHexBuffer = (value: string, pad: number) =>
    Buffer.from(value.padEnd(pad * 2, '0'), 'hex');
  console.log('msgParams ', msgParams)
  const hashedData = Buffer.from(msgParams).toString('hex');
  console.log('hashedData ', hashedData)
  const USER_DOMAIN_TAG = rightPaddedHexBuffer(
    Buffer.from('FLOW-V0.0-user').toString('hex'),
    32
  ).toString('hex');

  const prependUserDomainTag = (msg: string) => USER_DOMAIN_TAG + msg;
  const signableData = prependUserDomainTag(removeHexPrefix(hashedData));

  // Retrieve the private key from the wallet (assuming Ethereum wallet)
  const password = keyringService.password;
  const privateKey = await Wallet.getKey(password);
  const hashAlgo = await storage.get('hashAlgo');
  const signAlgo = await storage.get('signAlgo');
  const keyindex = await storage.get('keyIndex');
  console.log('keyindex ', keyindex)
  // const wallet = new ethers.Wallet(privateKey);
  const signature = await signWithKey(
    signableData,
    signAlgo,
    hashAlgo,
    privateKey
  );
  const currentWallet = await Wallet.getMainWallet();

  const addressHex = currentWallet;
  const addressBuffer = Buffer.from(addressHex.slice(2), 'hex');
  const addressArray = Uint8Array.from(addressBuffer);

  const encodedProof = createAndEncodeCOAOwnershipProof(
    [BigInt(keyindex)],
    addressArray,
    'evm',
    [Uint8Array.from(Buffer.from(signature, 'hex'))]
  );

  return '0x' + toHexString(encodedProof);
}

class ProviderController extends BaseController {

  ethRpc = async (data): Promise<any> => {
    const network = await Wallet.getNetwork(); // Get the current network
    const provider = new Web3.providers.HttpProvider(EVM_ENDPOINT[network]);
    const web3Instance = new Web3(provider);


    return new Promise((resolve, reject) => {
      if (!web3Instance.currentProvider) {
        console.error('Provider is undefined');
        return;
      }

      web3Instance.currentProvider.send({
        jsonrpc: "2.0",
        method: data.method,
        params: data.params,
        id: new Date().getTime()
      }, (err, response) => {
        if (err) {
          console.error('Error:', err);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  };

  ethRequestAccounts = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }

    const currentWallet = await Wallet.getMainWallet();

    let res: string | null;
    try {
      // Attempt to query the EVM address
      res = await Wallet.queryEvmAddress(currentWallet);
      console.log('Query successful:', res);
    } catch (error) {
      // If an error occurs, request approval
      console.error('Error querying EVM address:', error);

      await notificationService.requestApproval(
        {
          params: { origin },
          approvalComponent: 'EthEnable',
        },
        { height: 599 }
      );

      res = await Wallet.queryEvmAddress(currentWallet);
    }

    await notificationService.requestApproval(
      {
        params: { origin },
        approvalComponent: 'EthConnect',
      },
      { height: 599 }
    );

    res = ensureEvmAddressPrefix(res);
    const account = res ? [res.toLowerCase()] : [];
    sessionService.broadcastEvent('accountsChanged', account);
    const connectSite = permissionService.getConnectedSite(origin);

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
      console.error('Invalid data structure');
      return null;
    }

    // Accessing the first item in 'params' array
    const transactionParams = data.data.params[0];

    // Extracting individual parameters
    const from = transactionParams.from || '';
    const gas = transactionParams.gas || '0x76c0';
    const to = transactionParams.to || '';
    const value = transactionParams.value || '0.0';
    const dataValue = transactionParams.data || '0x';
    // console.log('transactionParams ', transactionParams)
    let result = await Wallet.dapSendEvmTX(to, gas, value, dataValue);
    if (!result.startsWith('0x')) {
      result = '0x' + result;
    }
    return result;
  };

  ethAccounts = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin) || !Wallet.isUnlocked()) {
      return [];
    }

    let currentWallet;
    try {
      // Attempt to query the currentNetwork address
      currentWallet = await Wallet.getMainWallet();
    } catch (error) {
      // If an error occurs, request approval
      console.error('Error querying EVM address:', error);

      await notificationService.requestApproval(
        {
          params: { origin },
          approvalComponent: 'EthConnect',
        },
        { height: 599 }
      );

      return;
    }

    let res: string | null;
    try {
      // Attempt to query the EVM address
      res = await Wallet.queryEvmAddress(currentWallet);
      console.log('Query successful:', res);
    } catch (error) {
      // If an error occurs, request approval
      console.error('Error querying EVM address:', error);

      await notificationService.requestApproval(
        {
          params: { origin },
          approvalComponent: 'EthConnect',
        },
        { height: 599 }
      );

      res = await Wallet.queryEvmAddress(currentWallet);
    }

    const account = res ? [res.toLowerCase()] : [];
    await sessionService.broadcastEvent('accountsChanged', account);
    await permissionService.getConnectedSite(origin);
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    await delay(2000);

    return account;
  };

  walletRequestPermissions = ({ data: { params: permissions } }) => {
    const result: Web3WalletPermission[] = [];
    if (permissions && 'eth_accounts' in permissions[0]) {
      result.push({ parentCapability: 'eth_accounts' });
    }
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
        console.log('Switch to Testnet');
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
        console.log('Switch to Mainnet');
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
        console.log(`Unsupported ChainId: ${chainId}`);
        throw ethErrors.provider.custom({
          code: 4902,
          message: `Unrecognized  ChainId"${chainId}".`,
        });
    }
  };

  personalSign = async ({ data, approvalRes, session }) => {
    if (!data.params) return;
    const [string, from] = data.params;
    const hex = isHexString(string) ? string : stringToHex(string);
    const result = await signMessage(
      { data: hex, from },
      approvalRes?.extra
    );
    signTextHistoryService.createHistory({
      address: from,
      text: string,
      origin: session.origin,
      type: 'personalSign',
    });
    return result;
  };

  private _checkAddress = async (address) => {
    // eslint-disable-next-line prefer-const
    return normalizeAddress(address).toLowerCase();
  };

  ethChainId = async ({ session }) => {
    const network = await Wallet.getNetwork();
    if (network === 'testnet') {
      return 545;
    } else {
      return 747;
    }
  };

  ethGetBalance = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result
  };

  ethGetCode = async (request) => {
    const result = await this.ethRpc(request.data);
    return result.result
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

  signTypeData = async (request) => {
    console.log('eth_signTypedData_v4  ', request);
    let address;
    let data;
    let currentChain

    await notificationService.requestApproval(
      {
        params: request,
        approvalComponent: 'EthSignType',
      },
      { height: 599 }
    );

    const network = await Wallet.getNetwork();
    const currentWallet = await Wallet.getMainWallet();
    const evmaddress = await Wallet.queryEvmAddress(currentWallet);

    if (network === 'testnet') {
      currentChain = 545;
    } else {
      currentChain = 747;
    }

    const paramAddress = request.data.params?.[0].toLowerCase() || ''


    if (
      isValidEthereumAddress(paramAddress)
    ) {
      data = request.data.params[1];
      address = request.data.params[0];
    } else {
      data = request.data.params[0];
      address = request.data.params[1];
    }


    if (ensureEvmAddressPrefix(evmaddress!.toLowerCase()) !== ensureEvmAddressPrefix(address.toLowerCase())) {

      console.log('evmaddress address ', evmaddress!.toLowerCase(), address.toLowerCase())
      throw new Error(
        "Provided address does not match the current address"
      );
    }
    console.log('data address ', address, data)
    const message = typeof data === "string" ? JSON.parse(data) : data;

    const signTypeMethod = request.data.method === "eth_signTypedData_v3"
      ? SignTypedDataVersion.V3
      : SignTypedDataVersion.V4;

    const hash = TypedDataUtils.eip712Hash(message, signTypeMethod)

    const result = await signTypeData(hash)
    signTextHistoryService.createHistory({
      address: address,
      text: data,
      origin: request.session.origin,
      type: 'ethSignTypedDataV4',
    });
    return result;

  }

  signTypeDataV1 = async (request) => {
    console.log('eth_signTypedData_v1  ', request);
    let address;
    let data;
    let currentChain

    await notificationService.requestApproval(
      {
        params: request,
        approvalComponent: 'EthSignV1',
      },
      { height: 599 }
    );

    const network = await Wallet.getNetwork();
    const currentWallet = await Wallet.getMainWallet();
    const evmaddress = await Wallet.queryEvmAddress(currentWallet);

    if (network === 'testnet') {
      currentChain = 545;
    } else {
      currentChain = 747;
    }

    const paramAddress = request.data.params?.[0] ? request.data.params?.[0] : ''

    if (
      isValidEthereumAddress(paramAddress)
    ) {
      data = request.data.params[1];
      address = request.data.params[0];
    } else {
      data = request.data.params[0];
      address = request.data.params[1];
    }

    console.log('evmaddress address ', address, evmaddress)

    if (ensureEvmAddressPrefix(evmaddress!.toLowerCase()) !== ensureEvmAddressPrefix(address.toLowerCase())) {
      throw new Error(
        "Provided address does not match the current address"
      );
    }

    const message = typeof data === "string" ? JSON.parse(data) : data;

    const hash = TypedDataUtils.eip712Hash(message, SignTypedDataVersion.V4)

    console.log('SignTypedDataVersion.V4 ', hash)
    const result = await signTypeData(hash)
    signTextHistoryService.createHistory({
      address: address,
      text: data,
      origin: request.session.origin,
      type: 'ethSignTypedDataV1',
    });
    return result;

  }
}

export default new ProviderController();
