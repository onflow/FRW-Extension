import { createPersistStore,createSessionStore } from 'background/utils';
import { TransactionItem } from './networkModel'
interface TransactionStore {
  expiry: number;
  total: number;
  transactionItem: Record<string, TransferItem[]>;
  pendingItem: Record<string, TransferItem[]>;
}

interface TransferItem {
  coin: string;
  status: string;
  sender:string;
  receiver:string;
  hash: string;
  time: number;
  interaction: string;
  amount:string;
  error:boolean;
  token:string;
  title:string;
  additionalMessage:string;
  type:number;
  transferType:number;
  image:string;
}

const now = new Date()

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
          mainnet:[],
          crescendo: [],
          testnet:[],
        },
        pendingItem: {
          mainnet:[],
          crescendo: [],
          testnet:[],
        },
      },
    });
    this.session = await createSessionStore<TransactionStore>({
      name: 'transaction',
      template: {
        expiry: now.getTime(),
        total: 0,
        transactionItem: {
          mainnet:[],
          crescendo: [],
          testnet:[],
        },
        pendingItem: {
          mainnet:[],
          testnet:[],
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
        mainnet:[],
        crescendo: [],
        testnet:[],
      },
      pendingItem: {
        mainnet:[],
        testnet:[],
        crescendo: [],
      }
    }
    this.session = {
      expiry: now.getTime(),
      total: 0,
      transactionItem: {
        mainnet:[],
        testnet:[],
        crescendo: [],
      },
      pendingItem: {
        mainnet:[],
        testnet:[],
        crescendo: [],
      }
    }
  }

  setPending = (txId: string, address:string, network, icon, title) => {
    const txList = this.session.pendingItem[network];
    const items = txList.filter(txItem => txItem.hash === txId)
    if (items.length > 0) {
      return
    }
    const now = new Date();
    const txItem: TransferItem = {
      coin: '',
      status: '',
      sender:'',
      receiver:'',
      hash: '',
      time: 0,
      interaction: '',
      amount:'',
      error:false,
      token:'',
      title:'',
      additionalMessage:'',
      type:1,
      transferType:1,
      image:'',
    } as  TransferItem;
    txItem.status = chrome.i18n.getMessage('PENDING');
    txItem.time = now.getTime();
    txItem.token = 'Exec Transaction';
    txItem.sender = address;
    txItem.error = false;
    txItem.hash = txId;
    txItem.image = icon;
    txItem.title = title;
    console.log('txItem ', txItem)
    txList.unshift(txItem);
    this.session.pendingItem[network] = txList;
  };

  removePending = (txId: string, address:string, network:string) => {
    const txList = this.session.pendingItem[network];
    const newList = txList.filter((item) =>{
      return item.hash !== txId;
    });
    this.session.pendingItem[network] = newList;
  };

  getExpiry = () => {
    return this.store.expiry;
  };

  setExpiry = (expiry: number) => {
    this.store.expiry = expiry;
  }

  setTransaction = (data, network:string) => {
    console.log('data ', data)
    const txList: TransferItem[] = [];
    if(data.transactions && data.transactions.length > 0) {
      data.transactions.forEach(async (tx) => {
        const transactionHolder = {
          coin: '',
          status: '',
          sender:'',
          receiver:'',
          hash: '',
          time: 0,
          interaction: '',
          amount:'',
          error:false,
          token:'',
          title:'',
          additionalMessage:'',
          type:1,
          transferType:1,
          image:'',
        } as TransferItem;
        // const amountValue = parseInt(tx.node.amount.value) / 100000000
        transactionHolder.sender = tx.sender
        transactionHolder.receiver = tx.receiver
        transactionHolder.time = tx.time
        transactionHolder.status = tx.status
        transactionHolder.hash = tx.txid
        transactionHolder.error = tx.error
        transactionHolder.image = tx.image
        transactionHolder.amount = tx.amount
        transactionHolder.interaction = tx.title
        transactionHolder.token = tx.token
        transactionHolder.type = tx.type
        transactionHolder.transferType = tx.transfer_type
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
