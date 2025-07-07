import type { TransactionStatus } from '@onflow/typedefs';

import { type TransferItem } from '@/shared/types/transaction-types';
import { isValidEthereumAddress, isValidFlowAddress } from '@/shared/utils/address';
import {
  transferListKey,
  transferListRefreshRegex,
  type TransferListStore,
} from '@/shared/utils/cache-data-keys';
import { consoleError } from '@/shared/utils/console-log';

import {
  getInvalidData,
  getValidData,
  registerRefreshListener,
  setCachedData,
} from '../utils/data-cache';

import openapiService, { type FlowTransactionResponse } from './openapi';

interface TransactionStore {
  pendingItem: {
    mainnet: Record<string, TransferItem[]>;
    testnet: Record<string, TransferItem[]>;
  };
}

class Transaction {
  private store: TransactionStore = {
    pendingItem: {
      mainnet: {},
      testnet: {},
    },
  };

  init = async () => {
    registerRefreshListener(transferListRefreshRegex, this.loadTransactions);
  };

  clear = async () => {};

  // Remove pending items older than 120 seconds
  private removeExpiredPendingItems = (network: string, address: string) => {
    const timeNow = new Date().getTime();
    const pendingList = this.store.pendingItem[network][address];
    if (pendingList.length > 0) {
      const filteredList = pendingList.filter((item) => item.time + 120_000 > timeNow);
      this.store.pendingItem[network][address] = structuredClone(filteredList);
    }
  };

  private getPendingList = (network: string, address: string): TransferItem[] => {
    // Always return a clone of the pending list
    if (
      !network ||
      !address ||
      !this.store.pendingItem[network] ||
      !this.store.pendingItem[network][address]
    ) {
      return [];
    }
    // Remove expired pending items from the list
    this.removeExpiredPendingItems(network, address);
    // Return a clone of the pending list
    return structuredClone(this.store.pendingItem[network][address]);
  };

  private setPendingList = (network: string, address: string, txList: TransferItem[]) => {
    if (network && address) {
      this.store.pendingItem[network][address] = structuredClone(txList);
    }
  };

  setPending = async (
    network: string,
    address: string,
    txId: string,
    icon: string,
    title: string
  ) => {
    const txList = this.getPendingList(network, address);
    const items = txList.filter((txItem) => txItem.hash.includes(txId));
    if (items.length > 0) {
      return;
    }
    const now = new Date();
    const txItem: TransferItem = {
      coin: '',
      status: '',
      sender: '',
      receiver: '',
      hash: '',
      time: 0,
      interaction: '',
      amount: '',
      error: false,
      token: '',
      title: '',
      additionalMessage: '',
      type: 1,
      transferType: 1,
      image: '',
      indexed: false,
      cadenceTxId: '',
      evmTxIds: [],
    } as TransferItem;

    // Not sure we have a string for this
    txItem.status = chrome.i18n.getMessage('PENDING');
    txItem.time = now.getTime();
    txItem.token = 'Exec Transaction';
    txItem.sender = address;
    txItem.error = false;
    txItem.hash = txId;
    txItem.cadenceTxId = txId;
    txItem.image = icon;
    txItem.title = title;
    txList.unshift(txItem);
    this.setPendingList(network, address, txList);

    // Get the existing indexed transaction list
    const existingTxStore = await getInvalidData<TransferListStore>(
      transferListKey(network, address)
    );
    if (existingTxStore) {
      existingTxStore.list.unshift(txItem);
      existingTxStore.pendingCount = existingTxStore.pendingCount + 1;
      existingTxStore.count = existingTxStore.count + 1;
      await setCachedData(transferListKey(network, address), existingTxStore);
    }
  };

  updatePending = async (
    network: string,
    address: string,
    txId: string,
    transactionStatus: TransactionStatus
  ): Promise<string> => {
    const txList = this.getPendingList(network, address);

    const txItemIndex = txList.findIndex((item) => item.hash.includes(txId));
    let combinedTxHash = txId;
    if (txItemIndex === -1) {
      // txItem not found, return
      return combinedTxHash;
    }
    const txItem = txList[txItemIndex];

    txItem.status =
      chrome.i18n.getMessage(transactionStatus.statusString) || transactionStatus.statusString;
    txItem.error = transactionStatus.statusCode === 1;

    const evmTxIds: string[] = transactionStatus.events?.reduce(
      (transactionIds: string[], event) => {
        if (event.type.includes('EVM') && !!event.data?.hash) {
          const hashBytes = event.data.hash.map((byte) => parseInt(byte));
          const hash = '0x' + Buffer.from(hashBytes).toString('hex');
          if (transactionIds.includes(hash)) {
            return transactionIds;
          }
          transactionIds.push(hash);
        }
        return transactionIds;
      },
      [] as string[]
    );
    txItem.evmTxIds = [...evmTxIds];

    if (evmTxIds.length > 0) {
      // We're sending an EVM transaction, we need to update the hash and may need to duplicate the pending item for each address
      if (evmTxIds.length > 10) {
        // TODO: Check there aren't 100s of evmTxIds
      }
      combinedTxHash = `${txItem.cadenceTxId || txItem.hash}_${evmTxIds.join('_')}`;
    }
    txList[txItemIndex] = txItem;
    // Always set pending transactions to 120 seconds
    this.setPendingList(network, address, txList);

    // Get the existing indexed transaction list
    const existingTxStore = await getInvalidData<TransferListStore>(
      transferListKey(network, address)
    );
    if (existingTxStore) {
      const storeItemIndex = existingTxStore.list.findIndex((item) => item.hash.includes(txId));
      if (storeItemIndex !== -1) {
        existingTxStore.list[storeItemIndex] = txItem;
        existingTxStore.pendingCount = existingTxStore.list.filter(
          (item) => item.status === 'PENDING'
        ).length;
        await setCachedData(transferListKey(network, address), existingTxStore);
      }
    }

    // Return the hash of the transaction
    return combinedTxHash;
  };

  removePending = async (network: string, address: string, txId: string) => {
    // Get the flow transactions
    const txList = await this.getPendingList(network, address);

    const newList = txList.filter((item) => {
      // Supports hashes with multiple ids
      // e.g. cadenceTxId_evmTxId
      return (
        !item.hash.includes(txId) &&
        !item.cadenceTxId?.includes(txId) &&
        !item.evmTxIds?.includes(txId)
      );
    });

    this.setPendingList(network, address, newList);
  };

  // only used when evm transaction get updated.
  clearPending = async (network: string, address: string) => {
    this.setPendingList(network, address, []);
  };

  private setTransaction = async (
    network: string,
    address: string,
    data: FlowTransactionResponse,
    offset: string,
    limit: string
  ): Promise<TransferListStore> => {
    const existingTxStore = await getInvalidData<TransferListStore>(
      transferListKey(network, address, offset, limit)
    );
    const existingTxList = existingTxStore?.list || [];
    const existingPendingList = await this.getPendingList(network, address);
    const txList: TransferItem[] = [];
    data?.transactions?.forEach(async (tx) => {
      const transactionHolder = {
        coin: '',
        status: '',
        sender: '',
        receiver: '',
        hash: '',
        time: 0,
        interaction: '',
        amount: '',
        error: false,
        token: '',
        title: '',
        additionalMessage: '',
        type: 1,
        transferType: 1,
        image: '',
        indexed: true,
      } as TransferItem;
      // const amountValue = parseInt(tx.node.amount.value) / 100000000
      transactionHolder.sender = tx.sender;
      transactionHolder.receiver = tx.receiver;
      transactionHolder.time = new Date(tx.time).getTime();
      transactionHolder.status = tx.status;
      transactionHolder.hash = tx.txid;
      transactionHolder.error = tx.error;
      transactionHolder.image = tx.image;
      transactionHolder.amount = tx.amount;
      transactionHolder.interaction = tx.title;
      transactionHolder.token = tx.token;
      transactionHolder.type = tx.type;
      transactionHolder.transferType = tx.transfer_type;
      transactionHolder.additionalMessage = tx.additional_message;
      // see if there's a pending item for this transaction
      const pendingItemIndex = existingPendingList.findIndex(
        (item) =>
          item.hash.includes(tx.txid) ||
          item.cadenceTxId?.includes(tx.txid) ||
          item.evmTxIds?.includes(tx.txid)
      );
      if (pendingItemIndex !== -1) {
        // Store the cadence transaction id
        transactionHolder.cadenceTxId = existingPendingList[pendingItemIndex].cadenceTxId;
        transactionHolder.evmTxIds = existingPendingList[pendingItemIndex].evmTxIds;
        existingPendingList.splice(pendingItemIndex, 1);
      } else {
        // see if there's an existing transaction with cadenceId in the store
        const existingTx = existingTxList.find(
          (item) =>
            item.hash.includes(tx.txid) ||
            item.cadenceTxId?.includes(tx.txid) ||
            item.evmTxIds?.includes(tx.txid)
        );
        if (existingTx && existingTx.cadenceTxId) {
          // Found existing cadence transaction id
          transactionHolder.cadenceTxId = existingTx.cadenceTxId;
          transactionHolder.evmTxIds = existingTx.evmTxIds;
        }
      }

      txList.push(transactionHolder);
    });
    this.setPendingList(network, address, existingPendingList);
    const transferListStore: TransferListStore = {
      count: data.total + existingPendingList.length,
      // This is the number of transaction that are in progress
      pendingCount: existingPendingList.filter((item) => item.status === 'PENDING').length,
      list: [...existingPendingList, ...txList],
    };
    await setCachedData(transferListKey(network, address, offset, limit), transferListStore);
    return transferListStore;
  };

  /**
   * Loads the transactions for a given address and network
   * @param network - The network to load the transactions from
   * @param address - The address to load the transactions from
   * @param limit - The limit of transactions to load (it's a number as a strin or empty string)
   * @param offset - The offset of the transactions to load (it's a number as a string or empty string)
   */
  loadTransactions = async (
    network: string,
    address: string,
    offset: string = '0',
    limit: string = '15'
  ): Promise<TransferListStore> => {
    if (openapiService.getNetwork() !== network) {
      // Do nothing if the network is switched
      // Don't update the cache
      return {
        count: 0,
        pendingCount: 0,
        list: [],
      };
    }
    if (isValidFlowAddress(address)) {
      // Get the flow transactions
      const flowResult = await openapiService.getTransfers(
        address,
        parseInt(offset ?? '0'),
        parseInt(limit ?? '15')
      );
      return this.setTransaction(network, address, flowResult, offset, limit);
    } else if (isValidEthereumAddress(address)) {
      try {
        const evmResult = await openapiService.getEVMTransfers(
          address,
          parseInt(offset ?? '0'),
          parseInt(limit ?? '15')
        );
        if (!evmResult.trxs) {
          throw new Error('Error loading EVM transactions');
        }
        const resultAsFlowResponse: FlowTransactionResponse = {
          total: evmResult.next_page_params
            ? evmResult.next_page_params.items_count
            : evmResult.trxs?.length || 0,
          transactions: evmResult.trxs || [],
        };
        return this.setTransaction(network, address, resultAsFlowResponse, offset, limit);
      } catch (error) {
        consoleError('Error loading EVM transactions', error);
        const emptyResult: FlowTransactionResponse = {
          total: 0,
          transactions: [],
        };

        return this.setTransaction(network, address, emptyResult, offset, limit);
      }
    } else {
      throw new Error('Invalid address');
    }
  };
  /**
   * Refresh pending transactions
   * This will just clear the pending list if it's expired
   * @param network
   * @param address
   * @returns
   */

  loadPendingTransactions = async (network: string, address: string) => {
    // This will clear the pending list if it's expired
    // Pending transactions last 120 seconds
    const pendingList = this.getPendingList(network, address);
    this.setPendingList(network, address, pendingList);
  };

  listAllTransactions = async (
    network: string,
    address: string,
    offset: string = '0',
    limit: string = '15'
  ): Promise<TransferListStore> => {
    const offsetString = offset ?? '0';
    const limitString = limit ?? '15';
    // Get the cached transaction list
    const transactionListStore = await getValidData<TransferListStore>(
      transferListKey(network, address, offsetString, limitString)
    );
    if (!transactionListStore) {
      return await this.loadTransactions(network, address, offsetString, limitString);
    }
    return transactionListStore;
  };

  listTransactions = async (
    network: string,
    address: string,
    offset: string = '0',
    limit: string = '15'
  ): Promise<TransferItem[]> => {
    const transactionListStore = await this.listAllTransactions(network, address, offset, limit);
    return transactionListStore.list;
  };

  listPending = async (network: string, address: string): Promise<TransferItem[]> => {
    return this.getPendingList(network, address);
  };

  getCount = async (
    network: string,
    address: string,
    offset: string,
    limit: string
  ): Promise<number> => {
    const transactionList = await this.listAllTransactions(network, address, offset, limit);
    return transactionList.count;
  };
}

export default new Transaction();
