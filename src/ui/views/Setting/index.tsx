import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
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
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { LLHeader } from '@/ui/components';
import CoinsIcon from '@/ui/components/CoinsIcon';
import IconAbout from '@/ui/components/iconfont/IconAbout';
import IconAccount from '@/ui/components/iconfont/IconAccount';
import IconAddressbook from '@/ui/components/iconfont/IconAddressbook';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import IconBackup from '@/ui/components/iconfont/IconBackup';
import IconDeveloper from '@/ui/components/iconfont/IconDeveloper';
import IconLock from '@/ui/components/iconfont/IconLock';
import { useWallet } from '@/ui/utils';
import { ReactComponent as Device } from 'ui/assets/svg/device.svg';
import { ReactComponent as IconLink } from 'ui/assets/svg/Iconlink.svg';
// Feature flags
const SHOW_DEVICES = false;

const SettingTab = () => {
  const usewallet = useWallet();
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
      <Box
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          paddingBottom: '8px',
        }}
      >
        <List
          sx={{
            width: '90%',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
            margin: '8px auto 16px auto',
            pt: 0,
            pb: 0,
          }}
        >
          <ListItem
            component={Link}
            to="/dashboard/setting/account"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <IconAccount size={18} color="#59A1DB" />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Profile')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
          <Divider sx={{ width: '90%' }} variant="middle" />
          <ListItem
            component={Link}
            to="/dashboard/setting/changepassword"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <IconLock size={18} color="#59A1DB" />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Change__Password')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
        <List
          sx={{
            width: '90%',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
            margin: '8px auto 16px auto',
            pt: 0,
            pb: 0,
          }}
        >
          <ListItem
            component={Link}
            to="/dashboard/setting/wallet"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <CoinsIcon width={18} height={18} color="#59A1DB" />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Acc__list')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          <Divider sx={{ width: '90%' }} variant="middle" />

          <ListItem
            component={Link}
            to="/dashboard/setting/addressbook"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <IconAddressbook size={18} color="#59A1DB" />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Address__Book')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          <Divider sx={{ width: '90%' }} variant="middle" />
          {!isActive && (
            <ListItem
              component={Link}
              to="/dashboard/setting/linked"
              disablePadding
              sx={{
                height: '66px',
                width: '100%',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemButton
                sx={{
                  width: '90%',
                  height: '100%',
                  overflow: 'hidden',
                  margin: '0 auto',
                  '&:hover': {
                    backgroundColor: '#282828',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: '25px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                    }}
                  >
                    <IconLink style={{ width: '18px', height: '18px', color: '#59A1DB' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText primary={chrome.i18n.getMessage('Linked_Account')} />
                <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                  <IconEnd size={12} />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          )}

          <Divider sx={{ width: '90%' }} variant="middle" />

          <ListItem
            component={Link}
            to="/dashboard/setting/currency"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <CurrencyExchangeIcon sx={{ width: '18px', height: '18px', color: '#59A1DB' }} />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Display__Currency')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          {!isActive && <Divider sx={{ width: '90%' }} variant="middle" />}
          {isKeyphrase && (
            <ListItem
              component={Link}
              to="/dashboard/setting/backups"
              disablePadding
              sx={{
                height: '66px',
                width: '100%',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemButton
                sx={{
                  width: '90%',
                  height: '100%',
                  overflow: 'hidden',
                  margin: '0 auto',
                  '&:hover': {
                    backgroundColor: '#282828',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: '25px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                    }}
                  >
                    <IconBackup size={18} color="#59A1DB" />
                  </Box>
                </ListItemIcon>
                <ListItemText primary={chrome.i18n.getMessage('Backup')} />
                <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                  <IconEnd size={12} />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          )}
        </List>

        <List
          sx={{
            width: '90%',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#282828',
            '&:hover': {
              backgroundColor: '#282828',
            },
            margin: '8px auto 18px auto',
            pt: 0,
            pb: 0,
          }}
        >
          <ListItem
            disablePadding
            onClick={() => window.open('https://core.flow.com')}
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <PhoneIphoneIcon sx={{ color: '#59A1DB', width: '18px', height: '18px' }} />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Try_Our_Mobile_APP')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px', spacing: '8px' }}>
                {/* <IconEnd size={12} /> */}
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
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          <Divider sx={{ width: '90%' }} variant="middle" />

          <ListItem
            component={Link}
            to="/dashboard/setting/developerMode"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <IconDeveloper size={18} color="#59A1DB" />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('Developer__Mode')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>

          <Divider sx={{ width: '90%' }} variant="middle" />

          {SHOW_DEVICES && (
            <>
              <ListItem
                component={Link}
                to="/dashboard/setting/devices"
                disablePadding
                sx={{
                  height: '66px',
                  width: '100%',
                  overflow: 'hidden',
                  '&:hover': {
                    backgroundColor: '#282828',
                  },
                }}
              >
                <ListItemButton
                  sx={{
                    width: '90%',
                    height: '100%',
                    overflow: 'hidden',
                    margin: '0 auto',
                    '&:hover': {
                      backgroundColor: '#282828',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '25px' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                      }}
                    >
                      <Device style={{ width: '18px', height: '18px', color: '#59A1DB' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={chrome.i18n.getMessage('Devices')} />
                  <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                    <IconEnd size={12} />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>

              <Divider sx={{ width: '90%' }} variant="middle" />
            </>
          )}

          <ListItem
            component={Link}
            to="/dashboard/setting/about"
            disablePadding
            sx={{
              height: '66px',
              width: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: '#282828',
              },
            }}
          >
            <ListItemButton
              sx={{
                width: '90%',
                height: '100%',
                overflow: 'hidden',
                margin: '0 auto',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '25px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                  }}
                >
                  <IconAbout size={18} color="#59A1DB" />
                </Box>
              </ListItemIcon>
              <ListItemText primary={chrome.i18n.getMessage('About')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </div>
  );
};

export default SettingTab;
