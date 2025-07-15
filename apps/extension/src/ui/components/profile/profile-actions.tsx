import { useTheme } from '@mui/material/styles';
import React from 'react';

import userCircleCheck from '@/ui/assets/svg/user-circle-check.svg';
import userCirclePlus from '@/ui/assets/svg/user-circle-plus.svg';
import { ProfileButton } from '@/ui/components/profile/profile-button';
import { useWallet } from '@/ui/hooks/use-wallet';

interface ProfileActionsProps {
  onActionComplete?: () => void;
  showImportButton?: boolean;
}

const ProfileActions = ({ onActionComplete, showImportButton = true }: ProfileActionsProps) => {
  const usewallet = useWallet();
  const theme = useTheme();

  const handleAction = async (action: () => Promise<void>) => {
    await action();
    //close the popup after new page is opened
    onActionComplete?.();
  };

  return (
    <div
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'column',
        display: 'flex',
        borderRadius: '16px',
        background: theme.palette.background.paper,
        margin: '9px 18px 0',
        overflow: 'hidden',
      }}
    >
      <ProfileButton
        icon={userCirclePlus}
        text={chrome.i18n.getMessage('Create_a_new_profile')}
        onClick={() => handleAction(async () => await usewallet.createProfile())}
        dataTestId="create-profile-button"
      />
      <div
        style={{
          height: '1px',
          width: '100%',
          padding: '1px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
        }}
      />
      {showImportButton && (
        <ProfileButton
          icon={userCircleCheck}
          text={chrome.i18n.getMessage('Recover_an_existing_profile')}
          onClick={() => handleAction(async () => await usewallet.lockAdd())}
          dataTestId="import-profile-button"
        />
      )}
    </div>
  );
};

export default ProfileActions;
