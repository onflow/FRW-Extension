import openapiService from '@/background/service/openapi';
import {
  type CadenceTokenInfo,
  type ExtendedTokenInfo,
  type EvmTokenInfo,
} from '@/shared/types/coin-types';
import { isValidEthereumAddress, isValidFlowAddress } from '@/shared/utils/address';
import {
  cadenceTokenInfoKey,
  cadenceTokenInfoRefreshRegex,
  type ChildAccountFtStore,
  childAccountFtKey,
  coinListKey,
  coinListRefreshRegex,
  evmTokenInfoKey,
  evmTokenInfoRefreshRegex,
  supportedCurrenciesKey,
  supportedCurrenciesRefreshRegex,
  type SupportedCurrenciesStore,
  childAccountFtRefreshRegex,
} from '@/shared/utils/cache-data-keys';
import { consoleError } from '@/shared/utils/console-log';

import { getValidData, registerRefreshListener, setCachedData } from '../utils/data-cache';

class CoinList {
  init = async () => {
    registerRefreshListener(coinListRefreshRegex, this.loadCoinList);
    registerRefreshListener(evmTokenInfoRefreshRegex, this.loadEvmTokenInfo);
    registerRefreshListener(cadenceTokenInfoRefreshRegex, this.loadCadenceTokenInfo);
    registerRefreshListener(supportedCurrenciesRefreshRegex, this.loadSupportedCurrencies);
    registerRefreshListener(childAccountFtRefreshRegex, this.loadChildAccountFt);
  };

  clear = async () => {};

  initCoinList = async (network: string, address: string, currency: string = 'USD') => {
    const coinList = await this.loadCoinList(network, address, currency);
    if (!coinList || coinList.length === 0) {
      return null;
    }
    return coinList;
  };

  /**
   * Get Cadence Token Info
   */
  getCadenceTokenInfo = async (network: string, address: string, currencyCode: string = 'USD') => {
    const cadenceTokenInfo = await getValidData<CadenceTokenInfo[]>(
      cadenceTokenInfoKey(network, address, currencyCode)
    );
    if (!cadenceTokenInfo) {
      return this.loadCadenceTokenInfo(network, address, currencyCode);
    }
    return cadenceTokenInfo;
  };

  /**
   * Load Cadence Token Info
   */
  loadCadenceTokenInfo = async (network: string, address: string, currencyCode: string = 'USD') => {
    const cadenceTokenInfo = await openapiService.fetchCadenceTokenInfo(
      network,
      address,
      currencyCode
    );

    setCachedData(cadenceTokenInfoKey(network, address, currencyCode), cadenceTokenInfo);

    return cadenceTokenInfo;
  };

  /**
   * Get Cadence Token Info
   */
  getEvmTokenInfo = async (network: string, address: string, currencyCode: string = 'USD') => {
    const evmTokenInfo = await getValidData<EvmTokenInfo[]>(
      evmTokenInfoKey(network, address, currencyCode)
    );
    if (!evmTokenInfo) {
      return this.loadEvmTokenInfo(network, address, currencyCode);
    }
    return evmTokenInfo;
  };

  /**
   * Load Cadence Token Info
   */
  loadEvmTokenInfo = async (network: string, address: string, currencyCode: string = 'USD') => {
    const evmTokenInfo = await openapiService.fetchEvmTokenInfo(network, address, currencyCode);

    setCachedData(evmTokenInfoKey(network, address, currencyCode), evmTokenInfo);

    return evmTokenInfo;
  };
  /**
   * Get the coin list, handle both EVM and Flow tokens. Include price information.
   */
  getCoinList = async (network: string, address: string, currencyCode: string = 'USD') => {
    const coinList = await getValidData<ExtendedTokenInfo[]>(
      coinListKey(network, address, currencyCode)
    );
    if (!coinList) {
      return this.loadCoinList(network, address, currencyCode);
    }
    return coinList;
  };
  /**
   * Load the coin list, handle both EVM and Flow tokens. Include price information.
   * @param address - The address of the user
   * @param network - The network of the user
   * @param currencyCode - The currency code of the user
   * @returns The tokens of the user
   */
  loadCoinList = async (
    network: string,
    address: string,
    currencyCode: string = 'USD'
  ): Promise<ExtendedTokenInfo[]> => {
    if (!address) {
      throw new Error('Address is required');
    }

    // Determine if address is EVM or Flow based on format
    const isEvmAddress = isValidEthereumAddress(address);
    const isFlowAddress = isValidFlowAddress(address);

    if (!isEvmAddress && !isFlowAddress) {
      throw new Error('Invalid address format');
    }

    try {
      let tokens: ExtendedTokenInfo[] = [];
      if (isEvmAddress) {
        const evmTokenInfo = await this.getEvmTokenInfo(network, address, currencyCode);
        tokens = await this.transformEvmTokenExtendedInfo(evmTokenInfo);
      } else {
        const cadenceTokenInfo = await this.getCadenceTokenInfo(network, address, currencyCode);
        tokens = await this.transformCadenceTokenExtendedInfo(cadenceTokenInfo);
      }

      // Set the cache
      setCachedData(coinListKey(network, address, currencyCode), tokens);

      return tokens;
    } catch (error) {
      consoleError('Error fetching user tokens:', error);
      throw error;
    }
  };

  private async transformCadenceTokenExtendedInfo(
    cadenceTokenInfo: CadenceTokenInfo[]
  ): Promise<ExtendedTokenInfo[]> {
    // Get the cadence token info from the cache

    const tokens = cadenceTokenInfo.map(
      (token): ExtendedTokenInfo => ({
        id: token.identifier,
        name: token.name,
        address: token.contractAddress,
        contractName: token.contractName,
        symbol: token.symbol,
        decimals: 8, // Default to 8 decimals for Flow tokens if not specified
        path: {
          vault: token.storagePath
            ? `/${token.storagePath.domain}/${token.storagePath.identifier}`
            : '', // Provide a default value if storagePath is null
          receiver: token.receiverPath
            ? `/${token.receiverPath.domain}/${token.receiverPath.identifier}`
            : '', // Provide a default value if receiverPath is null
          balance: token.balancePath
            ? `/${token.balancePath.domain}/${token.balancePath.identifier}`
            : '', // Provide a default value if balancePath is null
        },
        logoURI: token.logoURI || token.logos?.items?.[0]?.file?.url || '',
        extensions: {
          description: token.description,
          twitter: token.socials?.x?.url,
        },
        custom: false,
        price: token.priceInCurrency || '',
        total: token.balanceInCurrency || '',
        change24h: 0,
        balance: token.balance || '0',
        // Add CoinItem properties
        coin: token.name, // redundant for compatibility
        unit: token.symbol ?? token.contractName, // redundant for compatibility
        icon: token.logoURI || token.logos?.items?.[0]?.file?.url || '',
        flowIdentifier: token.identifier,
        isVerified: token.isVerified ? token.isVerified : false,
        priceInUSD: token.priceInUSD || '',
        balanceInUSD: token.balanceInUSD || '',
        priceInFLOW: token.priceInFLOW || '',
        balanceInFLOW: token.balanceInFLOW || '',
      })
    );
    return tokens;
  }

  private async transformEvmTokenExtendedInfo(
    evmTokenInfo: EvmTokenInfo[]
  ): Promise<ExtendedTokenInfo[]> {
    // Convert EvmTokenResponse to ExtendedTokenInfo
    const tokens = evmTokenInfo.map(
      (token): ExtendedTokenInfo => ({
        id: token.flowIdentifier || token.address,
        name: token.name,
        address: token.address,
        contractName: token.name, // Use name as contractName for EVM tokens
        symbol: token.symbol,
        decimals: token.decimals,
        path: {
          vault: '', // EVM tokens don't use Flow paths
          receiver: '',
          balance: '',
        },
        logoURI: token.logoURI || '',
        extensions: {},
        custom: false,
        price: token.priceInCurrency || '',
        total: token.balanceInCurrency || '',
        change24h: 0,
        balance: token.displayBalance || '0',
        // Add CoinItem properties
        coin: token.name, // redundant for compatibility
        unit: token.symbol, // redundant for compatibility
        icon: token.logoURI || '', // redundant for compatibility
        flowIdentifier: token.flowIdentifier,
        isVerified: token.isVerified,
        priceInUSD: token.priceInUSD || '',
        balanceInUSD: token.balanceInUSD || '',
        priceInFLOW: token.priceInFLOW || '',
        balanceInFLOW: token.balanceInFLOW || '',
      })
    );

    return tokens;
  }

  loadSupportedCurrencies = async () => {
    const supportedCurrencies = await openapiService.getSupportedCurrencies();
    setCachedData(supportedCurrenciesKey(), supportedCurrencies);
    return supportedCurrencies;
  };

  getSupportedCurrencies = async () => {
    const supportedCurrencies =
      await getValidData<SupportedCurrenciesStore>(supportedCurrenciesKey());
    if (!supportedCurrencies) {
      return this.loadSupportedCurrencies();
    }
    return supportedCurrencies;
  };

  // Child account FT
  loadChildAccountFt = async (network: string, parentAddress: string, childAccount: string) => {
    const childAccountFt = await openapiService.queryAccessibleFt(
      network,
      parentAddress,
      childAccount
    );
    setCachedData(childAccountFtKey(network, parentAddress, childAccount), childAccountFt);
    return childAccountFt;
  };

  getChildAccountFt = async (network: string, parentAddress: string, childAccount: string) => {
    const childAccountFt = await getValidData<ChildAccountFtStore>(
      childAccountFtKey(network, parentAddress, childAccount)
    );
    if (!childAccountFt) {
      return this.loadChildAccountFt(network, parentAddress, childAccount);
    }
    return childAccountFt;
  };
}

export default new CoinList();
