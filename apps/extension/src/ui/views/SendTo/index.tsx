import React, { useCallback, useEffect, useReducer } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router';

import { type FlowAddress, type WalletAddress } from '@/shared/types/wallet-types';
import { isValidAddress, isValidFlowAddress } from '@/shared/utils/address';
import { consoleWarn } from '@/shared/utils/console-log';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { transactionReducer, INITIAL_TRANSACTION_STATE } from '@/ui/reducers/transaction-reducer';

import SendToCadenceOrEvm from './SendToCadenceOrEvm';

export const SendTo = () => {
  // Remove or use only in development

  const { mainAddress, currentWallet, userInfo } = useProfiles();
  const { coins, coinsLoaded } = useCoins();
  const params = useParams();
  const token = params.id;
  const toAddress = params.toAddress;
  const location = useLocation();
  const navigate = useNavigate();

  const [transactionState, dispatch] = useReducer(transactionReducer, INITIAL_TRANSACTION_STATE);

  const handleTokenChange = useCallback(
    async (symbol: string) => {
      // shouldn't use symbol should use address
      const coinInfo = coins?.find((coin) => coin.unit.toLowerCase() === symbol.toLowerCase());
      if (coinInfo) {
        dispatch({
          type: 'setTokenInfo', // Change action type
          payload: {
            tokenInfo: coinInfo, // Update payload structure
          },
        });
        // Update the URL to the new token
        navigate(`/dashboard/token/${symbol.toLowerCase()}/send/${toAddress}`);
      } else {
        if (coinsLoaded) {
          throw new Error(`Token ${symbol} not found`);
        }
      }
    },
    [coins, coinsLoaded, navigate, toAddress]
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
        // Set the token to the default token using tokenInfo
        handleTokenChange(INITIAL_TRANSACTION_STATE.tokenInfo.symbol);
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
