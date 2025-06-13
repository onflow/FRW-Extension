import { type FeatureFlagKey } from '@/shared/types/feature-types';

// Mock implementation that can be controlled via global variables
export const useFeatureFlag = (featureFlag: FeatureFlagKey) => {
  // Check if we're in Storybook and have feature flag overrides
  if (typeof window !== 'undefined' && (window as any).__STORYBOOK_FEATURE_FLAGS__) {
    const featureFlags = (window as any).__STORYBOOK_FEATURE_FLAGS__;
    const result = featureFlags[featureFlag] !== undefined ? featureFlags[featureFlag] : false;
    return result;
  }

  // Default to false if no override is set
  return false;
};

export const useFeatureFlags = () => {
  // Check if we're in Storybook and have feature flag overrides
  if (typeof window !== 'undefined' && (window as any).__STORYBOOK_FEATURE_FLAGS__) {
    return (window as any).__STORYBOOK_FEATURE_FLAGS__;
  }

  // Default empty object
  return {};
};

export const useLatestVersion = () => null;
