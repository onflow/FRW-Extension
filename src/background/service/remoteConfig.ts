import { StatsigClient } from '@statsig/js-client';

import { type FeatureFlagKey, type FeatureFlags } from '@/shared/types/feature-types';
import { type UserInfoResponse } from '@/shared/types/network-types';
import {
  featureFlagKey,
  featureFlagRefreshRegex,
  type RemoteConfig,
  remoteConfigKey,
  remoteConfigRefreshRegex,
} from '@/shared/utils/cache-data-keys';
import { getCurrentProfileId, returnCurrentProfileId } from '@/shared/utils/current-id';

import { getValidData, registerRefreshListener, setCachedData } from '../utils/data-cache';

import openapi from './openapi';

import { userInfoService } from '.';

if (!process.env.STATSIG_CLIENT_ID) {
  throw new Error('STATSIG_CLIENT_ID is not set');
}
const STATSIG_CLIENT_ID: string = process.env.STATSIG_CLIENT_ID;

class RemoteConfigService {
  private statsigClient: StatsigClient = new StatsigClient(STATSIG_CLIENT_ID, {
    userID: 'anonymous',
  });

  init = async () => {
    await this.statsigClient.initializeAsync();

    registerRefreshListener(remoteConfigRefreshRegex, this.loadRemoteConfig);
    registerRefreshListener(featureFlagRefreshRegex, this.loadFeatureFlag);
  };

  updateUserInfo = async (userInfo: UserInfoResponse) => {
    await this.statsigClient.updateUserAsync({
      userID: userInfo.username,
      custom: {
        profileId: userInfo.id,
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
        private: userInfo.private,
        created: userInfo.created,
      },
    });
  };
  loadRemoteConfig = async (): Promise<RemoteConfig> => {
    this.statsigClient.logEvent('remote_config_loaded', 'remote_config_loaded', {
      version: '1.0.0',
      user_id: 'user-id',
    });
    await this.statsigClient.flush(); // optional, but will send events immediately

    const result = await openapi.sendRequest(
      'GET',
      process.env.API_CONFIG_PATH,
      {},
      {},
      process.env.API_BASE_URL
    );

    const config = result;

    setCachedData(remoteConfigKey(), config, 600_000); // 10 minutes
    return config;
  };

  getRemoteConfig = async (): Promise<RemoteConfig> => {
    const fullConfig = await getValidData<RemoteConfig>(remoteConfigKey());
    if (!fullConfig) {
      return this.loadRemoteConfig();
    }
    return fullConfig;
  };

  loadFeatureFlag = async (userName: string, featureFlag: string): Promise<boolean> => {
    const currentUserId = this.statsigClient.getContext().user.userID;
    if (currentUserId !== userName) {
      return false;
    }
    const flag = this.statsigClient.checkGate(featureFlag);
    setCachedData(featureFlagKey(userName, featureFlag), flag, 120_000); // 2 minutes
    return flag;
  };

  getFeatureFlag = async (featureFlag: FeatureFlagKey): Promise<boolean> => {
    const userId = await returnCurrentProfileId();
    if (!userId) {
      return false;
    }
    const userInfo = await userInfoService.getUserInfo(userId);
    if (!userInfo) {
      return false;
    }
    const flag = await getValidData<boolean>(featureFlagKey(userInfo.username, featureFlag));
    if (flag) {
      return flag;
    }
    return this.loadFeatureFlag(userInfo.username, featureFlag);
  };
}

export default new RemoteConfigService();
