import { describe, expect, it } from 'vitest';

import { type ExtendedTokenInfo } from '@onflow/flow-wallet-shared/types/coin-types';
import {
  type AddressType,
  type TokenType,
  type TransactionState,
} from '@onflow/flow-wallet-shared/types/transaction-types';
import { type WalletAddress } from '@onflow/flow-wallet-shared/types/wallet-types';

import {
  INITIAL_TRANSACTION_STATE,
  getTransactionStateString,
  transactionReducer,
} from '../transaction-reducer';

describe('Transaction Reducer', () => {
  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      expect(INITIAL_TRANSACTION_STATE).toMatchObject({
        currentTxState: '',
        rootAddress: '',
        fromAddress: '',
        tokenType: 'Flow' as TokenType,
        fromNetwork: 'Evm' as AddressType,
        toNetwork: 'Evm' as AddressType,
        toAddress: '',
        amount: '',
        fiatAmount: '',
        fiatCurrency: 'USD',
        fiatOrCoin: 'coin',
        balanceExceeded: false,
      });
    });
  });

  describe('getTransactionStateString', () => {
    it('should return empty string when required fields are missing', () => {
      const state = { ...INITIAL_TRANSACTION_STATE, tokenType: '' as TokenType };
      expect(getTransactionStateString(state)).toBe('');
    });

    it('should return correct transaction state string', () => {
      const state = {
        ...INITIAL_TRANSACTION_STATE,
        tokenType: 'Flow' as TokenType,
        fromNetwork: 'Evm' as AddressType,
        toNetwork: 'Cadence' as AddressType,
      };
      expect(getTransactionStateString(state)).toBe('FlowFromEvmToCadence');
    });
  });

  describe('Action Handlers', () => {
    describe('initTransactionState', () => {
      it('should initialize transaction state with EVM address', () => {
        const action = {
          type: 'initTransactionState' as const,
          payload: {
            rootAddress: '0x123' as WalletAddress,
            fromAddress: '0x1234567890123456789012345678901234567890' as WalletAddress,
          },
        };

        const newState = transactionReducer(INITIAL_TRANSACTION_STATE, action);
        expect(newState.rootAddress).toBe('0x123');
        expect(newState.fromAddress).toBe('0x1234567890123456789012345678901234567890');
        expect(newState.fromNetwork).toBe('Evm');
      });

      it('should initialize transaction state with Cadence address', () => {
        const rootAddress = '0x123abc' as WalletAddress;
        const action = {
          type: 'initTransactionState' as const,
          payload: {
            rootAddress,
            fromAddress: rootAddress,
          },
        };

        const newState = transactionReducer(INITIAL_TRANSACTION_STATE, action);
        expect(newState.fromNetwork).toBe('Cadence');
      });
    });

    describe('setTokenInfo', () => {
      const mockTokenInfo: ExtendedTokenInfo = {
        name: 'Test Token',
        address: '0x123',
        contractName: 'TestToken',
        path: {
          balance: '/public/testBalance',
          receiver: '/public/testReceiver',
          vault: '/storage/testVault',
        },
        logoURI: 'test.svg',
        decimals: 8,
        symbol: 'TEST',
        id: 'test',
        coin: 'test',
        unit: 'TEST',
        balance: '100',
        price: '1',
        change24h: 0,
        total: '100',
        icon: 'test.svg',
        priceInUSD: '1',
        balanceInUSD: '100',
        priceInFLOW: '2',
        balanceInFLOW: '200',
      };

      it('should set token info and update token type for non-Flow token', () => {
        const action = {
          type: 'setTokenInfo' as const,
          payload: {
            tokenInfo: mockTokenInfo,
          },
        };

        const newState = transactionReducer(INITIAL_TRANSACTION_STATE, action);
        expect(newState.tokenInfo).toEqual(mockTokenInfo);
        expect(newState.tokenType).toBe('FT');
      });

      it('should adjust amount decimals when switching to token with different decimals', () => {
        // First set an amount with the initial Flow token (8 decimals)
        const stateWithAmount = transactionReducer(INITIAL_TRANSACTION_STATE, {
          type: 'setAmount',
          payload: '123.456789012345',
        });

        // Then switch to a token with 6 decimals
        const token6Decimals: ExtendedTokenInfo = {
          ...mockTokenInfo,
          decimals: 6,
        };

        const newState = transactionReducer(stateWithAmount, {
          type: 'setTokenInfo' as const,
          payload: {
            tokenInfo: token6Decimals,
          },
        });

        // Should truncate to 6 decimals
        expect(newState.amount).toBe('123.456789');
      });

      it('should handle switching to token with more decimals', () => {
        // First set state with a 2 decimal token
        const token2Decimals: ExtendedTokenInfo = {
          ...mockTokenInfo,
          decimals: 2,
        };

        const stateWith2Decimals = transactionReducer(INITIAL_TRANSACTION_STATE, {
          type: 'setTokenInfo' as const,
          payload: {
            tokenInfo: token2Decimals,
          },
        });

        // Set an amount
        const stateWithAmount = transactionReducer(stateWith2Decimals, {
          type: 'setAmount',
          payload: '123.456',
        });

        // Should be truncated to 2 decimals
        expect(stateWithAmount.amount).toBe('123.45');

        // Switch to 8 decimal token
        const token8Decimals: ExtendedTokenInfo = {
          ...mockTokenInfo,
          decimals: 8,
        };

        const finalState = transactionReducer(stateWithAmount, {
          type: 'setTokenInfo' as const,
          payload: {
            tokenInfo: token8Decimals,
          },
        });

        // Should maintain 2 decimals since that was the input
        expect(finalState.amount).toBe('123.45');
      });
    });

    describe('setToAddress', () => {
      it('should set to address and determine correct network for EVM address', () => {
        const action = {
          type: 'setToAddress' as const,
          payload: {
            address: '0x1234567890123456789012345678901234567890' as WalletAddress,
          },
        };

        const newState = transactionReducer(INITIAL_TRANSACTION_STATE, action);
        expect(newState.toAddress).toBe('0x1234567890123456789012345678901234567890');
        expect(newState.toNetwork).toBe('Evm');
      });

      it('should set to address and determine correct network for Cadence address', () => {
        const action = {
          type: 'setToAddress' as const,
          payload: {
            address: '0x1234.5678' as WalletAddress,
          },
        };

        const newState = transactionReducer(INITIAL_TRANSACTION_STATE, action);
        expect(newState.toAddress).toBe('0x1234.5678');
        expect(newState.toNetwork).toBe('Cadence');
      });
    });

    describe('setAmount', () => {
      const stateWithBalance = {
        ...INITIAL_TRANSACTION_STATE,
        tokenInfo: {
          ...INITIAL_TRANSACTION_STATE.tokenInfo,
          balance: '100',
          price: '2',
        },
      };

      it('should handle coin amount input', () => {
        const action = {
          type: 'setAmount' as const,
          payload: '50',
        };

        const newState = transactionReducer(stateWithBalance, action);
        expect(newState.amount).toBe('50');
        expect(newState.fiatAmount).toBe('100.00000000');
        expect(newState.balanceExceeded).toBe(false);
      });

      it('should detect balance exceeded', () => {
        const action = {
          type: 'setAmount' as const,
          payload: '150',
        };

        const newState = transactionReducer(stateWithBalance, action);
        expect(newState.balanceExceeded).toBe(true);
      });

      it('should truncate decimals based on token decimals', () => {
        // Create state with a 4 decimal token
        const token4Decimals: ExtendedTokenInfo = {
          ...INITIAL_TRANSACTION_STATE.tokenInfo,
          decimals: 4,
        };

        const stateWith4Decimals = {
          ...stateWithBalance,
          tokenInfo: token4Decimals,
          tokenType: 'FT' as TokenType,
          fromNetwork: 'Evm' as AddressType,
          toNetwork: 'Cadence' as AddressType,
        };

        const action = {
          type: 'setAmount' as const,
          payload: '123.456789',
        };

        const newState = transactionReducer(stateWith4Decimals, action);
        expect(newState.amount).toBe('123.4567');
      });

      it('should handle amounts with no decimals', () => {
        const action = {
          type: 'setAmount' as const,
          payload: '100',
        };

        const newState = transactionReducer(
          {
            ...stateWithBalance,
            tokenType: 'Flow' as TokenType,
            fromNetwork: 'Evm' as AddressType,
            toNetwork: 'Cadence' as AddressType,
          },
          action
        );
        expect(newState.amount).toBe('100');
      });

      it('should preserve trailing zeros for precision', () => {
        const action = {
          type: 'setAmount' as const,
          payload: '100.100000',
        };

        const newState = transactionReducer(
          {
            ...stateWithBalance,
            tokenType: 'Flow' as TokenType,
            fromNetwork: 'Evm' as AddressType,
            toNetwork: 'Cadence' as AddressType,
          },
          action
        );
        // Should preserve trailing zeros for precision in crypto transactions
        expect(newState.amount).toBe('100.100000');
      });

      describe('network decimals handling', () => {
        it('should handle EVM to EVM transfers with up to 18 decimals', () => {
          const stateWithEvmNetworks: TransactionState = {
            ...stateWithBalance,
            fromNetwork: 'Evm' as AddressType,
            toNetwork: 'Evm' as AddressType,
            tokenInfo: {
              ...stateWithBalance.tokenInfo,
              decimals: 18,
            },
            fiatOrCoin: 'coin',
          };

          const action = {
            type: 'setAmount' as const,
            payload: '1.123456789012345678', // 18 decimals
          };

          const newState = transactionReducer(stateWithEvmNetworks, action);
          expect(newState.amount).toBe('1.123456789012345678');
        });

        it('should limit non-EVM transfers to 8 decimals', () => {
          const stateWithMixedNetworks: TransactionState = {
            ...stateWithBalance,
            fromNetwork: 'Evm' as AddressType,
            toNetwork: 'Cadence' as AddressType,
            tokenInfo: {
              ...stateWithBalance.tokenInfo,
              decimals: 18,
            },
            fiatOrCoin: 'coin',
          };

          const action = {
            type: 'setAmount' as const,
            payload: '1.123456789012345678', // 18 decimals
          };

          const newState = transactionReducer(stateWithMixedNetworks, action);
          expect(newState.amount).toBe('1.12345678'); // Should be truncated to 8 decimals
        });

        it('should respect token decimals even if less than network maximum', () => {
          const stateWithLowDecimalToken: TransactionState = {
            ...stateWithBalance,
            fromNetwork: 'Evm' as AddressType,
            toNetwork: 'Evm' as AddressType,
            tokenInfo: {
              ...stateWithBalance.tokenInfo,
              decimals: 6,
            },
            fiatOrCoin: 'coin',
          };

          const action = {
            type: 'setAmount' as const,
            payload: '1.123456789012345678', // 18 decimals
          };

          const newState = transactionReducer(stateWithLowDecimalToken, action);
          expect(newState.amount).toBe('1.123456'); // Should be truncated to 6 decimals
        });
      });
    });

    describe('setAmountToMax', () => {
      const stateWithBalance = {
        ...INITIAL_TRANSACTION_STATE,
        tokenInfo: {
          ...INITIAL_TRANSACTION_STATE.tokenInfo,
          balance: '100',
          price: '2',
        },
        tokenType: 'Flow' as TokenType,
        fromNetwork: 'Evm' as AddressType,
        toNetwork: 'Cadence' as AddressType,
      };

      it('should set maximum amount in coin mode', () => {
        const action = {
          type: 'setAmountToMax' as const,
        };

        const newState = transactionReducer(stateWithBalance, action);
        expect(newState.amount).toBe('100');
        expect(newState.fiatAmount).toBe('200.00000000');
      });

      it('should set maximum amount in fiat mode', () => {
        const action = {
          type: 'setAmountToMax' as const,
        };

        const stateInFiat = {
          ...stateWithBalance,
          fiatOrCoin: 'fiat' as const,
        };

        const newState = transactionReducer(stateInFiat, action);
        expect(newState.amount).toBe('100');
        expect(newState.fiatAmount).toBe('200.00000000');
        expect(newState.fiatOrCoin).toBe('fiat');
      });
    });

    describe('switchFiatOrCoin', () => {
      it('should switch between fiat and coin modes', () => {
        const action = {
          type: 'switchFiatOrCoin' as const,
        };

        const state1 = transactionReducer(
          {
            ...INITIAL_TRANSACTION_STATE,
            tokenType: 'Flow' as TokenType,
            fromNetwork: 'Evm' as AddressType,
            toNetwork: 'Cadence' as AddressType,
          },
          action
        );
        expect(state1.fiatOrCoin).toBe('fiat');

        const state2 = transactionReducer(state1, action);
        expect(state2.fiatOrCoin).toBe('coin');
      });
    });
  });
});
