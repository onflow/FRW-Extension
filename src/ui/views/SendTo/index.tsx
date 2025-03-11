import React, { useCallback, useEffect, useReducer } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { type FlowAddress, type WalletAddress } from '@/shared/types/wallet-types';
import { isValidAddress, isValidFlowAddress } from '@/shared/utils/address';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { transactionReducer, INITIAL_TRANSACTION_STATE } from '@/ui/reducers/transaction-reducer';
import { useWallet } from '@/ui/utils/WalletContext';

import SendToCadenceOrEvm from './SendToCadenceOrEvm';

export const SendTo = () => {
  // Remove or use only in development
  const wallet = useWallet();

  const { mainAddress, currentWallet, userInfo } = useProfiles();
  const { coins } = useCoins();
  const { id: token, toAddress } = useParams<{ id: string; toAddress: string }>();
  const location = useLocation();
  const history = useHistory();

  const [transactionState, dispatch] = useReducer(transactionReducer, INITIAL_TRANSACTION_STATE);

  const handleTokenChange = useCallback(
    async (symbol: string) => {
      const tokenInfo = await wallet.openapi.getTokenInfo(symbol);
      if (tokenInfo) {
        const coinInfo = coins.find(
          (coin) => coin.unit.toLowerCase() === tokenInfo.symbol.toLowerCase()
        );
        if (coinInfo) {
          dispatch({
            type: 'setSelectedToken',
            payload: {
              tokenInfo,
              coinInfo,
            },
          });
          // Update the URL to the new token
          history.replace(`/dashboard/token/${symbol.toLowerCase()}/send/${toAddress}`);
        }
      }
    },
    [coins, wallet, history, toAddress]
  );

  useEffect(() => {
    if (isValidFlowAddress(mainAddress) && isValidAddress(currentWallet?.address)) {
      dispatch({
        type: 'initTransactionState',
        payload: {
          rootAddress: mainAddress as FlowAddress,
          fromAddress: currentWallet.address as WalletAddress,
          fromContact: {
            id: 0,
            address: currentWallet.address as WalletAddress,
            contact_name: userInfo?.nickname || '',
            username: userInfo?.username || '',
            avatar: userInfo?.avatar || '',
          },
        },
      });
      // Setup the to address
      dispatch({
        type: 'setToAddress',
        payload: {
          address: toAddress as WalletAddress,
          contact: {
            id: 0,
            address: toAddress as WalletAddress,
            contact_name: '',
            username: '',
            avatar: '',
          },
        },
      });

      if (token) {
        handleTokenChange(token);
      } else {
        // Set the token to the default token
        handleTokenChange(INITIAL_TRANSACTION_STATE.selectedToken.symbol);
      }
    }
  }, [
    mainAddress,
    currentWallet?.address,
    userInfo?.nickname,
    userInfo?.username,
    userInfo?.avatar,
    token,
    toAddress,
    handleTokenChange,
    location.search,
  ]);

  const handleAmountChange = (amount: string) => {
    dispatch({
      type: 'setAmount',
      payload: amount,
    });
  };

  const handleSwitchFiatOrCoin = () => {
    dispatch({
      type: 'switchFiatOrCoin',
    });
  };

  const handleMaxClick = () => {
    dispatch({
      type: 'setAmountToMax',
    });
  };

  const handleFinalizeAmount = () => {
    dispatch({
      type: 'finalizeAmount',
    });
  };

  return (
    <SendToCadenceOrEvm
      transactionState={transactionState}
      handleAmountChange={handleAmountChange}
      handleTokenChange={handleTokenChange}
      handleSwitchFiatOrCoin={handleSwitchFiatOrCoin}
      handleMaxClick={handleMaxClick}
      handleFinalizeAmount={handleFinalizeAmount}
    />
  );
};

export default SendTo;
