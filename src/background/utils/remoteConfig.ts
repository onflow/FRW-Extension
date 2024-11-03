import defaultTokenList from './defaultTokenList.json';
import defaultConfig from './defaultConfig.json';
import { TokenModel, NFTModel } from '../service/networkModel';
import { storage } from '@/background/webapi';
import configJson from './firebase.config.json';
import testnetNftList from './defaultNftList.testnet.json';
import mainnetNftList from './defaultNftList.mainnet.json';
import openapi from '../service/openapi';
import {
  userWalletService,
} from '../service';
interface RemoteConfigResponse {
  flowCoins: TokenModel[]
  nftCollection: NFTModel[]
}

interface CacheState {
  result: any;
  expireTime: number;
}

const baseURL = configJson.functions[process.env.NODE_ENV!]

class fetchRemoteConfig {
  coinState: CacheState = {result:{}, expireTime:0};
  nftState = {
    mainnet: {
      result:{}, expireTime:0
    },
    testnet: {
      result:{}, expireTime:0
    }
  };
  configState: CacheState = {result:{}, expireTime:0};

  async flowCoins () {
    const expire = this.coinState.expireTime;
    const now = new Date();
    // one hour expire time
    const exp = 1000 * 60 * 60 * 1 + now.getTime();
    if (expire < now.getTime()) {
      try {

        const result = await openapi.sendRequest('GET', '/fetchFTList', {}, {}, baseURL)
        // fetch(`${baseURL}/fetchFTList`);
        // const result = await coins.json();
        console.log(result,'result coins')
        this.coinState.result = result;
        this.coinState.expireTime = exp;
        return result
      } catch (err) {
        console.error(err);
        return defaultTokenList
      }
    } else {
      return this.coinState.result;
    }
  }

  async nftCollection () {
    const network = await userWalletService.getNetwork();
    const expire = this.nftState[network].expireTime;
    const now = new Date();
    const exp = 1000 * 60 * 60 * 1 + now.getTime();
    let defaultNftList = testnetNftList;
    if (network == 'mainnet') {
      defaultNftList = mainnetNftList;
    }
    if (expire < now.getTime()) {
      try {
        const result = await openapi.getNFTListFromGithub(network);
        // fetch(`${baseURL}/fetchNFTList`);
        // const result = await coins.json();
        this.nftState[network].result = result;
        this.nftState[network].expireTime = exp;
        return result
      } catch (err) {
        console.error(err);
        return defaultNftList;
      }
    } else {
      return this.nftState[network].result;
    }
  }

  async nftv2Collection () {
    const network = await userWalletService.getNetwork();
    const address = await userWalletService.getCurrentAddress();
    const expire = this.nftState[network].expireTime;
    const now = new Date();
    const exp = 1000 * 60 * 60 * 1 + now.getTime();
    let defaultNftList = testnetNftList;
    if (network == 'mainnet') {
      defaultNftList = mainnetNftList;
    }
    if (expire < now.getTime()) {
      try {
        const result = await openapi.getNFTV2CollectionList(address, network);
        // fetch(`${baseURL}/fetchNFTList`);
        // const result = await coins.json();
        this.nftState[network].result = result;
        this.nftState[network].expireTime = exp;
        return result
      } catch (err) {
        console.error(err);
        return defaultNftList;
      }
    } else {
      return this.nftState[network].result;
    }
  }
  
  async remoteConfig () {
    const expire = this.configState.expireTime;
    const now = new Date();
    const exp = 1000 * 60 * 60 * 1 + now.getTime();
    if (expire < now.getTime()) {
      try {
        const result = await openapi.sendRequest('GET', '/config', {}, {}, baseURL)
        // fetch(`${baseURL}/config`);
        // const result = await config.json();
        this.configState.result = result;
        this.configState.expireTime = exp;
        await storage.set('freeGas', result.features.free_gas)
        await storage.set('alchemyAPI', result.features.alchemy_api)
        // console.log('remoteConfig ->', result, result.features.free_gas)
        return result
      } catch (err) {
        console.error(err);
        await storage.set('freeGas', defaultConfig.features.free_gas)
        return defaultConfig;
      }
    } else {
      return this.configState.result;
    }
  }
}


const fetchConfig = async(
  // remoteConfig
): Promise<RemoteConfigResponse> => {
  // if (process.env.NODE_ENV === 'production') {
  //   remoteConfig.settings.minimumFetchIntervalMillis =  1000 * 60 * 10;
  // } else {
  //   remoteConfig.settings.minimumFetchIntervalMillis =  1000 * 60 * 1;
  // }

  // remoteConfig.defaultConfig = {
  //   'nft_collections': defaultNftList,
  //   'flow_coins': defaultTokenList
  // }

  // await fetchAndActivate(remoteConfig);
  // const nftCollection = JSON.parse(getValue(remoteConfig, 'nft_collections').asString());

  // const flowCoins = JSON.parse(getValue(remoteConfig, 'flow_coins').asString());
  
  // return {nftCollection, flowCoins};
  const network = await userWalletService.getNetwork();
  let defaultNftList = testnetNftList;
  if (network == 'mainnet') {
    defaultNftList = mainnetNftList;
  }
  return {flowCoins: defaultTokenList, nftCollection: defaultNftList};
}

// export default {
//   flowCoins: fetchCoin, 
//   nftCollection: fetchNFT
// };

export default new fetchRemoteConfig();