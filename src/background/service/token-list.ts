import {
  type FungibleTokenInfo,
  type CustomFungibleTokenInfo,
  type EvmCustomTokenInfo,
} from '@/shared/types/coin-types';
import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { tokenListKey, tokenListRefreshRegex } from '@/shared/utils/cache-data-keys';
import { setUserData } from '@/shared/utils/user-data-access';
import { evmCustomTokenKey, getEvmCustomTokenData } from '@/shared/utils/user-data-keys';

import { getValidData, registerRefreshListener, setCachedData } from '../utils/data-cache';

import openapiService from './openapi';

import { userWalletService } from '.';

const defaultFlowToken = {
  name: 'Flow',
  address: '0x4445e7ad11568276',
  contractName: 'FlowToken',
  path: {
    balance: '/public/flowTokenBalance',
    receiver: '/public/flowTokenReceiver',
    vault: '/storage/flowTokenVault',
  },
  logoURI:
    'https://cdn.jsdelivr.net/gh/FlowFans/flow-token-list@main/token-registry/A.1654653399040a61.FlowToken/logo.svg',
  // On Evm networks we can use up to 18 decimals
  decimals: 18,
  symbol: 'flow',
};

class TokenList {
  init = async () => {
    registerRefreshListener(tokenListRefreshRegex, this.loadTokenList);
  };

  addFlowTokenIfMissing = (tokens) => {
    const hasFlowToken = tokens.some((token) => token.symbol.toLowerCase() === 'flow');
    if (!hasFlowToken) {
      return [defaultFlowToken, ...tokens];
    }
    return tokens;
  };
  addCustomEvmToken = async (network: string, token: CustomFungibleTokenInfo) => {
    const evmTokens = await getEvmCustomTokenData(network);
    const existingIndex = evmTokens.findIndex((t) => t.address === token.address);
    if (existingIndex !== -1) {
      evmTokens[existingIndex] = {
        ...evmTokens[existingIndex],
        coin: token.name,
        unit: token.symbol,
        flowIdentifier: token.flowIdentifier,
        address: token.address,
        custom: true,
      };
    } else {
      evmTokens.push({
        ...token,
        coin: token.name,
        unit: token.symbol,
        flowIdentifier: token.flowIdentifier,
        address: token.address,
        custom: true,
      });
    }
    await setUserData(evmCustomTokenKey(network), evmTokens);
  };

  removeCustomEvmToken = async (network: string, tokenAddress: string) => {
    const evmTokens = await getEvmCustomTokenData(network);
    const filteredEvmTokens = evmTokens.filter((t) => t.address !== tokenAddress);
    await setUserData(evmCustomTokenKey(network), filteredEvmTokens);
  };

  mergeCustomTokens = (tokens: CustomFungibleTokenInfo[], customTokens: EvmCustomTokenInfo[]) => {
    customTokens.forEach((custom) => {
      const existingToken = tokens.find(
        (token) => token.address?.toLowerCase() === custom.address?.toLowerCase()
      );

      if (existingToken) {
        // If the custom token is found, set the custom key to true
        existingToken.custom = true;
      } else {
        // If the custom token is not found, add it to the tokens array
        tokens.push({
          ...custom,
          custom: true,
          chainId: MAINNET_CHAIN_ID,
          symbol: custom.unit,
          name: custom.coin,
          decimals: 18,
          logoURI: '',
          flowIdentifier: custom.flowIdentifier,
          tags: [],
        });
      }
    });
  };

  getTokenInfo = async (
    network: string,
    chainType: string,
    name: string
  ): Promise<CustomFungibleTokenInfo | undefined> => {
    // FIX ME: Get defaultTokenList from firebase remote config

    const tokens = await this.getTokenList(network, chainType);
    return tokens.find((item) => item.symbol.toLowerCase() === name.toLowerCase());
  };

  getTokenList = async (network: string, chainType: string): Promise<CustomFungibleTokenInfo[]> => {
    const ftList = await getValidData<CustomFungibleTokenInfo[]>(tokenListKey(network, chainType));
    if (ftList) return ftList;

    return await this.loadTokenList(network, chainType);
  };

  loadTokenList = async (network: string, chainType: string): Promise<FungibleTokenInfo[]> => {
    const tokens = await openapiService.fetchFTListFull(network, chainType);

    if (chainType === 'evm') {
      const evmCustomToken = await getEvmCustomTokenData(network);
      this.mergeCustomTokens(
        tokens.map((token) => ({ ...token, custom: false })),
        evmCustomToken
      );
    }
    setCachedData(tokenListKey(network, chainType), tokens);
    return tokens;
  };
  getEvmList = async (network) => {
    return this.getTokenList(network, 'evm');
  };

  getAllTokenInfo = async (
    network: string,
    chainType: string,
    filterNetwork = true
  ): Promise<CustomFungibleTokenInfo[]> => {
    const list = await this.getTokenList(network, chainType);
    return filterNetwork ? list.filter((item) => item.address) : list;
  };

  isWalletTokenStorageEnabled = async (network: string, chainType: string, tokenSymbol: string) => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const address = await userWalletService.getCurrentAddress();
    const tokenInfo = await this.getTokenInfo(network, chainType, tokenSymbol);
    if (!tokenInfo || !address) {
      return;
    }
    return await openapiService.isTokenStorageEnabled(address, tokenInfo);
  };

  getWalletTokenBalance = async (network: string, chainType: string, tokenSymbol: string) => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const address = await userWalletService.getCurrentAddress();
    const tokenInfo = await this.getTokenInfo(network, chainType, tokenSymbol);
    if (!tokenInfo || !address) {
      return;
    }
    return await openapiService.getTokenBalanceWithModel(address, tokenInfo);
  };

  getTokenBalance = async (
    network: string,
    chainType: string,
    address: string,
    tokenSymbol: string
  ) => {
    // FIX ME: Get defaultTokenList from firebase remote config
    const tokenInfo = await this.getTokenInfo(network, chainType, tokenSymbol);
    if (!tokenInfo) {
      return;
    }
    return await openapiService.getTokenBalanceWithModel(address, tokenInfo);
  };
}

export default new TokenList();
