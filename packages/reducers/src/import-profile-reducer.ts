import { FLOW_BIP44_PATH } from '@/shared/constant/algo-constants';
import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';

export const IMPORT_STEPS = {
  IMPORT: 'import',
  PICK_USERNAME: 'pick_username',
  SET_PASSWORD: 'set_password',
  RECOVER_PASSWORD: 'recover_password',
  GOOGLE_BACKUP: 'google_backup',
  ALL_SET: 'all_set',
} as const;

export type ImportStepType = (typeof IMPORT_STEPS)[keyof typeof IMPORT_STEPS];

export interface ImportState {
  activeTab: ImportStepType;
  mnemonic: string;
  pk: string | null;
  username?: string;
  nickname: string;
  password?: string;
  accounts: PublicKeyAccount[];
  errMessage: string;
  showError: boolean;
  showGoogleImport: boolean;
  googleAccounts: string[];
  path: string;
  phrase: string;
  isAddWallet: boolean;
}

export const INITIAL_IMPORT_STATE: ImportState = {
  activeTab: IMPORT_STEPS.IMPORT,
  mnemonic: '',
  pk: null,
  username: undefined,
  nickname: '',
  password: DEFAULT_PASSWORD,
  accounts: [],
  errMessage: '',
  showError: false,
  showGoogleImport: false,
  googleAccounts: [],
  path: FLOW_BIP44_PATH,
  phrase: '',
  isAddWallet: false,
};

export type ImportAction =
  | { type: 'SET_ACTIVE_TAB'; payload: ImportStepType }
  | { type: 'SET_MNEMONIC'; payload: string }
  | { type: 'SET_PK'; payload: string | null }
  | { type: 'SET_IS_ADD_WALLET'; payload: boolean }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_NICKNAME'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: PublicKeyAccount[] }
  | { type: 'SET_ERROR'; payload: { message: string; show: boolean } }
  | { type: 'SET_GOOGLE_IMPORT'; payload: { show: boolean; accounts: string[] } }
  | { type: 'SET_DERIVATION_PATH'; payload: string }
  | { type: 'SET_PASSPHRASE'; payload: string }
  | { type: 'GO_BACK' };

export const importProfileReducer = (state: ImportState, action: ImportAction): ImportState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_MNEMONIC':
      return { ...state, mnemonic: action.payload };
    case 'SET_PK':
      return { ...state, pk: action.payload };
    case 'SET_IS_ADD_WALLET':
      return { ...state, isAddWallet: action.payload };
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SET_NICKNAME':
      return { ...state, nickname: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_ERROR':
      return { ...state, errMessage: action.payload.message, showError: action.payload.show };
    case 'SET_GOOGLE_IMPORT':
      return {
        ...state,
        showGoogleImport: action.payload.show,
        googleAccounts: action.payload.accounts,
      };
    case 'SET_DERIVATION_PATH':
      return { ...state, path: action.payload };
    case 'SET_PASSPHRASE':
      return { ...state, phrase: action.payload };
    case 'GO_BACK': {
      switch (state.activeTab) {
        case IMPORT_STEPS.PICK_USERNAME:
          return { ...state, activeTab: IMPORT_STEPS.IMPORT };
        case IMPORT_STEPS.SET_PASSWORD:
          return { ...state, activeTab: IMPORT_STEPS.PICK_USERNAME };
        case IMPORT_STEPS.RECOVER_PASSWORD:
          return { ...state, activeTab: IMPORT_STEPS.IMPORT };
        default:
          return state;
      }
    }
    default:
      return state;
  }
};
