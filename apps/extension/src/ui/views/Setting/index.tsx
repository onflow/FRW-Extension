import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import { Box, Divider, IconButton, List } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import { AboutIcon } from '@/ui/assets/icons/settings/About';
import { AccountListIcon } from '@/ui/assets/icons/settings/AccountList';
import { AddProfileIcon } from '@/ui/assets/icons/settings/AddProfile';
import { AddressIcon } from '@/ui/assets/icons/settings/Address';
import { BackupIcon } from '@/ui/assets/icons/settings/Backup';
import { CurrencyIcon } from '@/ui/assets/icons/settings/Currency';
import { DevicesIcon } from '@/ui/assets/icons/settings/Devices';
import { DevmodeIcon } from '@/ui/assets/icons/settings/Devmode';
import { EditIcon } from '@/ui/assets/icons/settings/Edit';
import { MobileIcon } from '@/ui/assets/icons/settings/Mobile';
import { SecurityIcon } from '@/ui/assets/icons/settings/Security';
import { LLHeader } from '@/ui/components';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { ProfileItem } from '@/ui/components/profile/profile-item';
import SettingsListItem from '@/ui/components/settings/setting-list-item';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useProfiles } from '@/ui/hooks/useProfileHook';
// Feature flags
const SHOW_DEVICES = false;

const SettingTab = () => {
  const usewallet = useWallet();
  const { profileIds, activeAccountType, userInfo } = useProfiles();
  const [isKeyphrase, setIsKeyphrase] = useState(false);

  const checkIsKeyphrase = useCallback(async () => {
    const keyrings = await usewallet.checkMnemonics();
    await setIsKeyphrase(keyrings);
  }, [usewallet]);

  useEffect(() => {
    checkIsKeyphrase();
  }, [checkIsKeyphrase]);

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Settings')} help={false} goBackLink="/dashboard" />
      {userInfo && profileIds && profileIds.length > 1 && (
        <Box
          sx={{
            margin: '8px auto',
            padding: '0 18px',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
        >
          <Link to="/dashboard/setting/profile" data-testid="setting-goto-account-button">
            <ProfileItem
              profileId={userInfo?.id}
              selectedProfileId={userInfo?.id}
              switchAccount={async () => {}}
              setLoadingId={() => {}}
              rightIcon={<EditIcon width={24} height={24} />}
              noPadding={true}
            />
          </Link>
        </Box>
      )}
      <Box
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: '8px 18px',
        }}
      >
        {/* top link */}
        <List
          className="list"
          sx={{
            margin: '8px auto 16px auto',
            pt: 0,
            pb: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
          }}
        >
          <SettingsListItem
            to="/dashboard/setting/accountlist"
            icon={<AccountListIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Accounts')}
            showArrow={false}
          />
          <Divider sx={{ width: '90%' }} variant="middle" />
          <SettingsListItem
            to="/dashboard/setting/addressbook"
            icon={<AddressIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('AddressBook')}
            showArrow={false}
          />
        </List>
        <List
          className="list"
          sx={{
            margin: '8px auto 16px auto',
            pt: 0,
            pb: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
          }}
        >
          <SettingsListItem
            to="/dashboard/setting/currency"
            icon={<CurrencyIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Display__Currency')}
            endIcon={<IconEnd size={12} />}
          />

          {activeAccountType === 'main' && <Divider sx={{ width: '90%' }} variant="middle" />}
          {isKeyphrase && activeAccountType === 'main' && (
            <SettingsListItem
              to="/dashboard/setting/backups"
              icon={<BackupIcon width={24} height={24} />}
              text={chrome.i18n.getMessage('Backup')}
              endIcon={<IconEnd size={12} />}
            />
          )}
          <Divider sx={{ width: '90%' }} variant="middle" />
          <SettingsListItem
            to="/dashboard/setting/changepassword"
            icon={<SecurityIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Password')}
            endIcon={<IconEnd size={12} />}
          />
        </List>
        <List
          className="list"
          sx={{
            margin: '8px auto 18px auto',
            pt: 0,
            pb: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
          }}
        >
          <SettingsListItem
            to="https://core.flow.com"
            icon={<MobileIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Try_Our_Mobile_APP')}
            endIcon={
              <>
                <IconButton
                  onClick={() =>
                    window.open(
                      'https://apps.apple.com/ca/app/flow-wallet-nfts-and-crypto/id6478996750'
                    )
                  }
                >
                  <AppleIcon fontSize="small" color="disabled" />
                </IconButton>
                <IconButton
                  onClick={() =>
                    window.open(
                      'https://play.google.com/store/apps/details?id=com.flowfoundation.wallet'
                    )
                  }
                >
                  <AndroidIcon fontSize="small" color="disabled" />
                </IconButton>
              </>
            }
          />

          <Divider sx={{ width: '90%' }} variant="middle" />

          <SettingsListItem
            to="/dashboard/setting/developerMode"
            icon={<DevmodeIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Developer__Mode')}
            endIcon={<IconEnd size={12} />}
          />

          <Divider sx={{ width: '90%' }} variant="middle" />

          {SHOW_DEVICES && (
            <>
              <SettingsListItem
                to="/dashboard/setting/devices"
                icon={<DevicesIcon width={24} height={24} />}
                text={chrome.i18n.getMessage('Devices')}
                endIcon={<IconEnd size={12} />}
              />
              <Divider sx={{ width: '90%' }} variant="middle" />
            </>
          )}

          <SettingsListItem
            to="/dashboard/setting/about"
            icon={<AboutIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('About')}
            endIcon={<IconEnd size={12} />}
          />
        </List>
        <List
          className="list"
          sx={{
            margin: '8px auto 18px auto',
            pt: 0,
            pb: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
          }}
        >
          <SettingsListItem
            onClick={async () => await usewallet.lockAdd()}
            icon={<AddProfileIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Add_Profile') || 'Add Profile'}
            endIcon={<IconEnd size={12} />}
          />
        </List>
      </Box>
    </div>
  );
};

export default SettingTab;
