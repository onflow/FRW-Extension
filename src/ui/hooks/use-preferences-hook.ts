import { preferencesKey, type PreferenceStore } from '@/shared/utils/user-data-keys';

import { useUserData } from './use-data';

const usePreferenceData = () => {
  const preferenceData = useUserData<PreferenceStore>(preferencesKey);
  return preferenceData;
};

export default usePreferenceData;
