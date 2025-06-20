import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import {
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Divider,
  CardMedia,
  IconButton,
  Box,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

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
import { SettingsListItem } from '@/ui/components/settings/list-item';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import {
  COLOR_WHITE_FFFFFF,
  COLOR_WHITE_ALPHA_10_FFFFFF1A,
  COLOR_WHITE_ALPHA_40_FFFFFF66,
} from '@/ui/style/color';
import { useWallet } from '@/ui/utils';
// Feature flags
const SHOW_DEVICES = false;

// Styles
const useStyles = makeStyles(() => ({
  listDiv: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: '8px',
  },
  itemButton: {
    width: '90%',
    height: '100%',
    overflow: 'hidden',
    margin: '0 auto',
    '&:hover': {
      backgroundColor: '#282828',
    },
  },
  list: {
    width: '90%',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#282828',
    '&:hover': {
      backgroundColor: '#282828',
    },
  },
  listIcon: {
    minWidth: '25px',
  },
  icon: {
    color: '#59A1DB',
    width: '18px',
    height: '18px',
    marginRight: '14px',
  },
  iconOthers: {
    color: '#59A1DB',
    width: '18px',
    height: '18px',
    marginRight: '14px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
  },
}));

const SettingTab = () => {
  const classes = useStyles();
  const usewallet = useWallet();
  const { profileIds, userInfo } = useProfiles();
  const [isActive, setIsActive] = useState(false);
  const [isKeyphrase, setIsKeyphrase] = useState(false);

  const checkIsActive = useCallback(async () => {
    // setSending(true);
    const activeAccountType = await usewallet.getActiveAccountType();
    if (activeAccountType === 'child') {
      setIsActive(true);
    }
    const keyrings = await usewallet.checkMnemonics();
    await setIsKeyphrase(keyrings);
  }, [usewallet]);

  useEffect(() => {
    checkIsActive();
  }, [checkIsActive]);

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Settings')} help={false} />
      <div className={classes.listDiv}>
        {profileIds && profileIds.length > 1 && (
          <List sx={{ margin: '8px auto 16px auto', pt: 0, pb: 0 }}>
            <ListItem component={Link} to="/dashboard/setting/account" sx={{ padding: '0 18px' }}>
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <CardMedia
                  component="img"
                  image={userInfo?.avatar}
                  alt={userInfo?.nickname}
                  sx={{ width: '40px', height: '40px', borderRadius: '8px' }}
                />
              </ListItemIcon>
              <ListItemText
                sx={{
                  color: COLOR_WHITE_FFFFFF,
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '120%',
                  letterSpacing: '-0.084px',
                  marginLeft: '16px',
                }}
              >
                {userInfo?.nickname}
              </ListItemText>
              <ListItemIcon
                aria-label="end"
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  padding: '8px',
                  borderRadius: '100%',
                  backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: COLOR_WHITE_ALPHA_40_FFFFFF66,
                  },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <EditIcon width={24} height={24} />
              </ListItemIcon>
            </ListItem>
          </List>
        )}

        {/* top link */}
        <List className={classes.list} sx={{ margin: '8px auto 16px auto', padding: '0' }}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            <ListItem
              component={Link}
              to="/dashboard/setting/addressbook"
              disablePadding
              sx={{ flex: 1 }}
            >
              <ListItemButton
                className={classes.itemButton}
                sx={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '8px',
                  paddingY: '18px',
                }}
              >
                <Box className={classes.iconContainer}>
                  <AddressIcon width={28} height={28} />
                </Box>
                <ListItemText
                  primary={chrome.i18n.getMessage('Address')}
                  sx={{ textAlign: 'center', margin: '0' }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem
              component={Link}
              to="/dashboard/setting/wallet"
              disablePadding
              sx={{ flex: 1 }}
            >
              <ListItemButton
                className={classes.itemButton}
                sx={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '8px',
                  paddingY: '18px',
                }}
              >
                <Box className={classes.iconContainer}>
                  <AccountListIcon width={28} height={28} />
                </Box>
                <ListItemText
                  primary={chrome.i18n.getMessage('Acc__list')}
                  sx={{ textAlign: 'center', margin: '0' }}
                />
              </ListItemButton>
            </ListItem>
          </Box>
        </List>
        <List className={classes.list} sx={{ margin: '8px auto 16px auto', pt: 0, pb: 0 }}>
          <SettingsListItem
            to="/dashboard/setting/currency"
            icon={<CurrencyIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Display__Currency')}
            endIcon={<IconEnd size={12} />}
          />

          {!isActive && <Divider sx={{ width: '90%' }} variant="middle" />}
          {isKeyphrase && (
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
            text={chrome.i18n.getMessage('Security')}
            endIcon={<IconEnd size={12} />}
          />
        </List>
        <List className={classes.list} sx={{ margin: '8px auto 18px auto', pt: 0, pb: 0 }}>
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
        <List className={classes.list} sx={{ margin: '8px auto 18px auto', pt: 0, pb: 0 }}>
          <SettingsListItem
            to="/dashboard/setting"
            icon={<AddProfileIcon width={24} height={24} />}
            text={chrome.i18n.getMessage('Add_Profile')}
            endIcon={<IconEnd size={12} />}
          />
        </List>
      </div>
    </div>
  );
};

export default SettingTab;
