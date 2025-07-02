// Re-export everything from the original ui/utils except WalletContext
export * from '../ui/utils/WindowContext';
export * from '../ui/utils/webapi';
export * from '../ui/utils/time';
export * from '../shared/utils/number';

// Re-export other utils from the main index file
export {
  noop,
  getUiType,
  hex2Text,
  isEmoji,
  hexToUint8Array,
  getUITypeName,
  getOriginName,
  hashCode,
  isMetaMaskActive,
  ellipsisOverflowedText,
  formatAddress,
  HexToDecimalConverter,
  returnFilteredCollections,
  truncate,
} from '../ui/utils';

// Import and re-export the mocked WalletContext
export { useWallet, useWalletLoaded } from '../ui/utils/WalletContext.mock';

// Import and re-export the mocked useProfiles hook
export { useProfiles } from '../ui/hooks/useProfileHook.mock';
