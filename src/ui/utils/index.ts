import {
  IS_CHROME,
  CHECK_METAMASK_INSTALLED_URL,
} from 'consts';
import { Account } from 'background/service/preference';
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => { };

export * from './WalletContext';
export * from './WindowContext';

export * from './hooks';

export * from './webapi';

export * from './time';

export * from './number';

export * from './options';

export * from './saveStorage';

const UI_TYPE = {
  Tab: 'index',
  Pop: 'popup',
  Notification: 'notification',
};

type UiTypeCheck = {
  isTab: boolean;
  isNotification: boolean;
  isPop: boolean;
};

export const getUiType = (): UiTypeCheck => {
  const { pathname } = window.location;
  return Object.entries(UI_TYPE).reduce((m, [key, value]) => {
    m[`is${key}`] = pathname === `/${value}.html`;

    return m;
  }, {} as UiTypeCheck);
};

export const hex2Text = (hex: string) => {
  try {
    return hex.startsWith('0x')
      ? decodeURIComponent(
        hex.replace(/^0x/, '').replace(/[0-9a-f]{2}/g, '%$&')
      )
      : hex;
  } catch {
    return hex;
  }
};

export const isEmoji = (char) => {
  // Regular expression to match most emojis
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  return emojiRegex.test(char);
};


export const hexToUint8Array = (hexString: string) => {
  if (hexString.startsWith('0x')) {
    hexString = hexString.substring(2);
  }

  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString; // Pad with zero if odd
  }

  const arrayLength = hexString.length / 2;
  const uint8Array = new Uint8Array(arrayLength);

  for (let i = 0; i < arrayLength; i++) {
    const byte = hexString.substr(i * 2, 2);
    uint8Array[i] = parseInt(byte, 16);
  }

  return uint8Array;
}

export const getUITypeName = (): string => {
  const UIType = getUiType();

  if (UIType.isPop) return 'popup';
  if (UIType.isNotification) return 'notification';
  if (UIType.isTab) return 'tab';

  return 'popup';
};

/**
 *
 * @param origin (exchange.pancakeswap.finance)
 * @returns (pancakeswap)
 */
export const getOriginName = (origin: string) => {
  const matches = origin.replace(/https?:\/\//, '').match(/^([^.]+\.)?(\S+)\./);

  return matches ? matches[2] || origin : origin;
};

export const hashCode = (str: string) => {
  if (!str) return 0;
  let hash = 0,
    i,
    chr,
    len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const isMetaMaskActive = async () => {
  let url = '';

  if (IS_CHROME) {
    url = CHECK_METAMASK_INSTALLED_URL.Chrome;
  }

  if (!url) return false;

  try {
    const res = await window.fetch(url);
    await res.text();

    return true;
  } catch (e) {
    return false;
  }
};

export const ellipsisOverflowedText = (
  str: string,
  length = 5,
  removeLastComma = false
) => {
  if (str.length <= length) return str;
  let cut = str.substring(0, length);
  if (removeLastComma) {
    if (cut.endsWith(',')) {
      cut = cut.substring(0, length - 1);
    }
  }
  return `${cut}...`;
};

export function getHashAlgo(value: string): number {
  switch (value) {
    case 'unknown':
      return 0;
    case 'SHA2_256':
      return 1;
    case 'SHA2_384':
      return 2;
    case 'SHA3_256':
      return 3;
    case 'SHA3_384':
      return 4;
    default:
      return -1; // Handle unknown values
  }
}

export function getSignAlgo(value: string): number {
  switch (value) {
    case 'unknown':
      return 0;
    case 'ECDSA_P256':
      return 1;
    case 'ECDSA_p256':
      return 1;
    case 'ECDSA_SECP256k1':
      return 2;
    case 'ECDSA_secp256k1':
      return 2;
    default:
      return -1; // Handle unknown values
  }
}


export function getStringFromHashAlgo(value: number): string {
  switch (value) {
    case 0:
      return 'unknown';
    case 1:
      return 'SHA2_256';
    case 2:
      return 'SHA2_384';
    case 3:
      return 'SHA3_256';
    case 4:
      return 'SHA3_384';
    default:
      return 'unknown'; // Handle unknown values
  }
}

export function getStringFromSignAlgo(value: number): string {
  switch (value) {
    case 0:
      return 'unknown';
    case 1:
      return 'ECDSA_P256';
    case 2:
      return 'ECDSA_SECP256k1';
    default:
      return 'unknown'; // Handle unknown values
  }
}

export const formatAddress = (address) => {
  if (address && address.length >= 30) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 8)}`;
  }
  return address;
};