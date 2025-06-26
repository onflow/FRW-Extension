import React from 'react';

import { useUserInfo } from '@/ui/hooks/use-account-hooks';

import { ProfileItemBase } from './profile-item-base';

export const ProfileItem = ({
  profileId,
  selectedProfileId,
  switchAccount,
  setLoadingId,
}: {
  profileId: string;
  selectedProfileId?: string;
  switchAccount: (profileId: string) => Promise<void>;
  setLoadingId: (id: string) => void;
}) => {
  const userInfo = useUserInfo(profileId);
  return (
    <ProfileItemBase
      key={profileId}
      profileId={profileId}
      selectedProfileId={selectedProfileId}
      onClick={switchAccount}
      setLoadingId={setLoadingId}
      userInfo={userInfo}
    />
  );
};
