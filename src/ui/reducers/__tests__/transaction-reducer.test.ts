import { type TokenInfo } from 'flow-native-token-registry';
import { describe, expect, it } from 'vitest';

import { type CoinItem } from '@/shared/types/coin-types';
import {
  type NetworkType,
  type TokenType,
  type TransactionState,
} from '@/shared/types/transaction-types';
import { type WalletAddress } from '@/shared/types/wallet-types';

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
        fromNetwork: 'Evm' as NetworkType,
        toNetwork: 'Evm' as NetworkType,
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
        fromNetwork: 'Evm' as NetworkType,
        toNetwork: 'Cadence' as NetworkType,
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

    describe('setSelectedToken', () => {
      const mockTokenInfo: TokenInfo = {
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
      };

      const mockCoinInfo: CoinItem = {
        id: 'test',
        coin: 'test',
        unit: 'TEST',
        balance: '100',
        price: 1,
        change24h: 0,
        total: 100,
        icon: 'test.svg',
      };

      it('should set token info and update token type for non-Flow token', () => {
        const action = {
          type: 'setSelectedToken' as const,
          payload: {
            tokenInfo: mockTokenInfo,
            coinInfo: mockCoinInfo,
          },
        };

        const newState = transactionReducer(INITIAL_TRANSACTION_STATE, action);
        expect(newState.selectedToken).toEqual(mockTokenInfo);
        expect(newState.tokenType).toBe('FT');
        expect(newState.coinInfo).toEqual(mockCoinInfo);
      });

      it('should adjust amount decimals when switching to token with different decimals', () => {
        // First set an amount with the initial Flow token (8 decimals)
        const stateWithAmount = transactionReducer(INITIAL_TRANSACTION_STATE, {
          type: 'setAmount',
          payload: '123.456789012345',
        });

        // Then switch to a token with 6 decimals
        const token6Decimals: TokenInfo = {
          ...mockTokenInfo,
          decimals: 6,
        };

        const newState = transactionReducer(stateWithAmount, {
          type: 'setSelectedToken',
          payload: {
            tokenInfo: token6Decimals,
            coinInfo: mockCoinInfo,
          },
        });

        // Should truncate to 6 decimals
        expect(newState.amount).toBe('123.456789');
      });

      it('should handle switching to token with more decimals', () => {
        // First set state with a 2 decimal token
        const token2Decimals: TokenInfo = {
          ...mockTokenInfo,
          decimals: 2,
        };

        const stateWith2Decimals = transactionReducer(INITIAL_TRANSACTION_STATE, {
          type: 'setSelectedToken',
          payload: {
            tokenInfo: token2Decimals,
            coinInfo: mockCoinInfo,
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
        const token8Decimals: TokenInfo = {
          ...mockTokenInfo,
          decimals: 8,
        };

        const finalState = transactionReducer(stateWithAmount, {
          type: 'setSelectedToken',
          payload: {
            tokenInfo: token8Decimals,
            coinInfo: mockCoinInfo,
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
        coinInfo: {
          ...INITIAL_TRANSACTION_STATE.coinInfo,
          balance: '100',
          price: 2,
        },
        selectedToken: {
          ...INITIAL_TRANSACTION_STATE.selectedToken,
          decimals: 8,
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
        const token4Decimals: TokenInfo = {
          ...INITIAL_TRANSACTION_STATE.selectedToken,
          decimals: 4,
        };

        const stateWith4Decimals = {
          ...stateWithBalance,
          selectedToken: token4Decimals,
          tokenType: 'FT' as TokenType,
          fromNetwork: 'Evm' as NetworkType,
          toNetwork: 'Cadence' as NetworkType,
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
            fromNetwork: 'Evm' as NetworkType,
            toNetwork: 'Cadence' as NetworkType,
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
            fromNetwork: 'Evm' as NetworkType,
            toNetwork: 'Cadence' as NetworkType,
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
            fromNetwork: 'Evm' as NetworkType,
            toNetwork: 'Evm' as NetworkType,
            selectedToken: {
              ...stateWithBalance.selectedToken,
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
            fromNetwork: 'Evm' as NetworkType,
            toNetwork: 'Cadence' as NetworkType,
            selectedToken: {
              ...stateWithBalance.selectedToken,
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
            fromNetwork: 'Evm' as NetworkType,
            toNetwork: 'Evm' as NetworkType,
            selectedToken: {
              ...stateWithBalance.selectedToken,
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
        coinInfo: {
          ...INITIAL_TRANSACTION_STATE.coinInfo,
          balance: '100',
          price: 2,
        },
        tokenType: 'Flow' as TokenType,
        fromNetwork: 'Evm' as NetworkType,
        toNetwork: 'Cadence' as NetworkType,
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
            fromNetwork: 'Evm' as NetworkType,
            toNetwork: 'Cadence' as NetworkType,
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
