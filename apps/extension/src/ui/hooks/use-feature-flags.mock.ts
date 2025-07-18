import { fn } from 'storybook/test';

import * as actual from './use-feature-flags';
import packageJson from '../../../package.json';

const { version } = packageJson;

// Mock implementation that can be controlled via global variables
export const useFeatureFlag = fn(actual.useFeatureFlag)
  .mockName('useFeatureFlag')
  .mockReturnValue(false);
export const useFeatureFlags = fn(actual.useFeatureFlags)
  .mockName('useFeatureFlags')
  .mockReturnValue({
    create_new_account: false,
    import_existing_account: false,
  });
export const useLatestVersion = fn(actual.useLatestVersion)
  .mockName('useLatestVersion')
  .mockReturnValue(version);
