import type { TransactionStatus } from '@onflow/typedefs';

import { type TransferItem } from '@/shared/types/transaction-types';
import createPersistStore from 'background/utils/persisitStore';
import createSessionStore from 'background/utils/sessionStore';

interface TransactionStore {
  expiry: number;
  total: number;
  transactionItem: Record<string, TransferItem[]>;
  pendingItem: Record<string, TransferItem[]>;
}

const now = new Date();

class Transaction {
  store!: TransactionStore;
  session!: TransactionStore;

  init = async () => {
    this.store = await createPersistStore<TransactionStore>({
      name: 'transaction',
      template: {
        expiry: now.getTime(),
        total: 0,
        transactionItem: {
          mainnet: [],
          crescendo: [],
          testnet: [],
        },
        pendingItem: {
          mainnet: [],
          crescendo: [],
          testnet: [],
        },
      },
    });
    this.session = await createSessionStore<TransactionStore>({
      name: 'transaction',
      template: {
        expiry: now.getTime(),
        total: 0,
        transactionItem: {
          mainnet: [],
          crescendo: [],
          testnet: [],
        },
        pendingItem: {
          mainnet: [],
          testnet: [],
          crescendo: [],
        },
      },
    });
  };

  clear = () => {
    this.store = {
      expiry: now.getTime(),
      total: 0,
      transactionItem: {
        mainnet: [],
        crescendo: [],
        testnet: [],
      },
      pendingItem: {
        mainnet: [],
        testnet: [],
        crescendo: [],
      },
    };
    this.session = {
      expiry: now.getTime(),
      total: 0,
      transactionItem: {
        mainnet: [],
        testnet: [],
        crescendo: [],
      },
      pendingItem: {
        mainnet: [],
        testnet: [],
        crescendo: [],
      },
    };
  };

  setPending = (txId: string, address: string, network, icon, title) => {
    const txList = this.session.pendingItem[network];
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
    this.session.pendingItem[network] = [...txList];

    // Send a message to the UI to update the transfer list
    chrome.runtime.sendMessage({ msg: 'transferListUpdated' });
  };

  updatePending = (txId: string, network: string, transactionStatus: TransactionStatus): string => {
    const txList = this.session.pendingItem[network];
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
        console.warn('updatePending - evmTxIds.length > 10', evmTxIds);
      }
      combinedTxHash = `${txItem.cadenceTxId || txItem.hash}_${evmTxIds.join('_')}`;
    }
    txList[txItemIndex] = txItem;

    this.session.pendingItem[network] = [...txList];
    // Send a message to the UI to update the transfer list
    chrome.runtime.sendMessage({ msg: 'transferListUpdated' });

    // Return the hash of the transaction
    return combinedTxHash;
  };

  removePending = (txId: string, address: string, network: string) => {
    const txList = this.session.pendingItem[network];
    const newList = txList.filter((item) => {
      // Supports hashes with multiple ids
      // e.g. cadenceTxId_evmTxId
      return (
        !item.hash.includes(txId) &&
        !item.cadenceTxId?.includes(txId) &&
        !item.evmTxIds?.includes(txId)
      );
    });
    this.session.pendingItem[network] = [...newList];
  };

  // only used when evm transaction get updated.
  clearPending = (network: string) => {
    this.session.pendingItem[network] = [];
  };

  getExpiry = () => {
    return this.store.expiry;
  };

  setExpiry = (expiry: number) => {
    this.store.expiry = expiry;
  };

  setTransaction = (data, network: string) => {
    const txList: TransferItem[] = [];
    if (data.transactions && data.transactions.length > 0) {
      data.transactions.forEach(async (tx) => {
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
        transactionHolder.time = tx.time;
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
        const pendingItem = this.session.pendingItem[network].find(
          (item) =>
            item.hash.includes(tx.txid) ||
            item.cadenceTxId?.includes(tx.txid) ||
            item.evmTxIds?.includes(tx.txid)
        );
        if (pendingItem) {
          // Store the cadence transaction id
          transactionHolder.cadenceTxId = pendingItem.cadenceTxId;
          transactionHolder.evmTxIds = pendingItem.evmTxIds;
        } else {
          // see if there's an existing transaction with cadenceId in the store
          const existingTx = this.store.transactionItem[network]?.find(
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
        this.removePending(tx.txid, tx.sender, network);
      });
      this.store.transactionItem[network] = txList;
      this.store.total = data.total;
    }
  };

  listTransactions = (network: string): TransferItem[] => {
    return this.store.transactionItem[network];
  };

  listPending = (network: string): TransferItem[] => {
    return this.session.pendingItem[network];
  };

  getCount = (): number => {
    return this.store.total;
  };
}

export default new Transaction();
