import { type FeatureFlagKey } from '@/shared/types/feature-types';
import { featureFlagKey, type RemoteConfig, remoteConfigKey } from '@/shared/utils/cache-data-keys';

import { useCurrentId, useUserInfo } from './use-account-hooks';
import { useCachedData } from './use-data';

export const useFeatureFlag = (featureFlag: FeatureFlagKey) => {
  const currentId = useCurrentId();
  const userInfo = useUserInfo(currentId);
  const userName = userInfo?.username;
  const flag = useCachedData<boolean>(userName && featureFlagKey(userName, featureFlag));

  return flag;
};

export const useLatestVersion = () => {
  const remoteConfig = useCachedData<RemoteConfig>(remoteConfigKey());
  return remoteConfig?.version;
};
