import { type FeatureFlagKey } from '@/shared/types/feature-types';
import { type RemoteConfig, remoteConfigKey } from '@/shared/utils/cache-data-keys';

import { useCachedData } from './use-data';

export const useFeatureFlags = () => {
  const remoteConfig = useCachedData<RemoteConfig>(remoteConfigKey());
  return remoteConfig?.config.features;
};

export const useFeatureFlag = (featureFlag: FeatureFlagKey) => {
  const remoteConfig = useCachedData<RemoteConfig>(remoteConfigKey());
  return remoteConfig?.config.features[featureFlag] || false;
};

export const useLatestVersion = () => {
  const remoteConfig = useCachedData<RemoteConfig>(remoteConfigKey());
  return remoteConfig?.version;
};
