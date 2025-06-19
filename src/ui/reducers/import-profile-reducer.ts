import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';
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
  pk: string;
  address: string; // The address the user wants to import
  username: string;
  password?: string;
  accounts: PublicKeyAccount[];
  accountAlreadyImported: boolean;
  errMessage: string;
  showError: boolean;
  showGoogleImport: boolean;
  googleAccounts: string[];
  path: string;
  phrase: string;
}

export const INITIAL_IMPORT_STATE: ImportState = {
  activeTab: IMPORT_STEPS.IMPORT,
  mnemonic: '',
  pk: '',
  address: '',
  username: '',
  password: DEFAULT_PASSWORD,
  accounts: [],
  accountAlreadyImported: false,
  errMessage: '',
  showError: false,
  showGoogleImport: false,
  googleAccounts: [],
  path: FLOW_BIP44_PATH,
  phrase: '',
};

export type ImportAction =
  | { type: 'SET_ACTIVE_TAB'; payload: ImportStepType }
  | { type: 'SET_MNEMONIC'; payload: string }
  | { type: 'SET_PK'; payload: string }
  | { type: 'SET_ADDRESS'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: PublicKeyAccount[] }
  | { type: 'SET_ACCOUNT_ALREADY_IMPORTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { message: string } }
  | { type: 'SET_GOOGLE_IMPORT'; payload: { show: boolean; accounts: string[] } }
  | { type: 'SET_DERIVATION_PATH'; payload: string }
  | { type: 'SET_PASSPHRASE'; payload: string }
  | { type: 'GO_BACK' }
  | { type: 'GO_NEXT' };

export const importProfileReducer = (state: ImportState, action: ImportAction): ImportState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_MNEMONIC':
      return { ...state, mnemonic: action.payload };
    case 'SET_PK':
      return { ...state, pk: action.payload };
    case 'SET_ADDRESS':
      return { ...state, address: action.payload };
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_ACCOUNT_ALREADY_IMPORTED':
      return { ...state, accountAlreadyImported: action.payload };
    case 'SET_ERROR':
      return {
        ...state,
        errMessage: action.payload.message,
        showError: action.payload.message !== '',
      };
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
    case 'GO_NEXT': {
      switch (state.activeTab) {
        case IMPORT_STEPS.IMPORT:
          return { ...state, activeTab: IMPORT_STEPS.PICK_USERNAME };
        case IMPORT_STEPS.PICK_USERNAME:
          return { ...state, activeTab: IMPORT_STEPS.SET_PASSWORD };
        case IMPORT_STEPS.SET_PASSWORD:
          // We can't backup if we don't have a mnemonic
          if (state.pk) {
            return { ...state, activeTab: IMPORT_STEPS.ALL_SET };
          } else {
            return { ...state, activeTab: IMPORT_STEPS.GOOGLE_BACKUP };
          }
        case IMPORT_STEPS.RECOVER_PASSWORD:
          return { ...state, activeTab: IMPORT_STEPS.GOOGLE_BACKUP };
        case IMPORT_STEPS.GOOGLE_BACKUP:
          if (!state.password) {
            throw new Error('No password provided');
          }

          return { ...state, activeTab: IMPORT_STEPS.ALL_SET };
        default:
          return state;
      }
    }
    default:
      return state;
  }
};
