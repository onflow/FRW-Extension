import { fn } from 'storybook/test';

// Mock the useTransferList hook
export const useTransferList = fn().mockName('useTransferList').mockReturnValue({
  occupied: false,
  transactions: [],
  monitor: null,
  flowscanURL: null,
  viewSourceURL: null,
  loading: false,
  showButton: false,
  count: 0,
});
