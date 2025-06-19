import * as bip39 from 'bip39';

import { DEFAULT_PASSWORD } from '@/shared/utils/default';

export const STEPS = {
  USERNAME: 'username',
  RECOVERY: 'recovery',
  REPEAT: 'repeat',
  PASSWORD: 'password',
  BACKUP: 'backup',
  ALL_SET: 'all_set',
} as const;

export type StepType = (typeof STEPS)[keyof typeof STEPS];

export interface RegisterState {
  activeTab: StepType;
  username: string;
  password: string;
  mnemonic: string;
  isAddWallet: boolean;
}

export const INITIAL_REGISTER_STATE: RegisterState = {
  activeTab: STEPS.USERNAME,
  username: '',
  password: DEFAULT_PASSWORD,
  mnemonic: '',
  isAddWallet: false,
};

export const initRegisterState = (initialState: RegisterState): RegisterState => {
  return {
    ...initialState,
    mnemonic: bip39.generateMnemonic(),
  };
};

export type RegisterAction =
  | { type: 'SET_ACTIVE_TAB'; payload: StepType }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_IS_ADD_WALLET'; payload: boolean }
  | { type: 'GO_BACK' }
  | { type: 'GO_NEXT' };

export const registerReducer = (state: RegisterState, action: RegisterAction): RegisterState => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'SET_IS_ADD_WALLET':
      return { ...state, isAddWallet: action.payload };
    case 'GO_BACK': {
      switch (state.activeTab) {
        case STEPS.RECOVERY:
          return { ...state, activeTab: STEPS.USERNAME };
        case STEPS.REPEAT:
          return { ...state, activeTab: STEPS.RECOVERY };
        case STEPS.PASSWORD:
          return { ...state, activeTab: STEPS.REPEAT };
        case STEPS.BACKUP:
          return { ...state, activeTab: STEPS.PASSWORD };
        default:
          return state;
      }
    }
    case 'GO_NEXT': {
      switch (state.activeTab) {
        case STEPS.USERNAME:
          return { ...state, activeTab: STEPS.RECOVERY };
        case STEPS.RECOVERY:
          return { ...state, activeTab: STEPS.REPEAT };
        case STEPS.REPEAT:
          return { ...state, activeTab: STEPS.PASSWORD };
        case STEPS.PASSWORD:
          return { ...state, activeTab: STEPS.BACKUP };
        case STEPS.BACKUP:
          return { ...state, activeTab: STEPS.ALL_SET };
        default:
          return state;
      }
    }
    default:
      return state;
  }
};
