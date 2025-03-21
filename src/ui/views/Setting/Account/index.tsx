import { Switch, switchClasses } from '@mui/base/Switch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Typography, IconButton, Box, Avatar } from '@mui/material';
import { styled } from '@mui/system';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { useWallet } from 'ui/utils';

import EditAccount from './EditAccount';

const orange = {
  500: '#41CC5D',
};

const grey = {
  400: '#BABABA',
  500: '#787878',
  600: '#5E5E5E',
};

const Root = styled('span')(
  ({ theme }) => `
    font-size: 0;
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    // margin: 0;
    margin-left: auto;
    cursor: pointer;

    &.${switchClasses.disabled} {
      opacity: 0.4;
      cursor: not-allowed;
    }

    & .${switchClasses.track} {
      background: ${theme.palette.mode === 'dark' ? grey[600] : grey[400]};
      border-radius: 10px;
      display: block;
      height: 100%;
      width: 100%;
      position: absolute;
    }

    & .${switchClasses.thumb} {
      display: block;
      width: 14px;
      height: 14px;
      top: 3px;
      left: 3px;
      border-radius: 16px;
      background-color: #fff;
      position: relative;
      transition: all 200ms ease;
    }

    &.${switchClasses.focusVisible} .${switchClasses.thumb} {
      background-color: ${grey[500]};
      box-shadow: 0 0 1px 8px rgba(0, 0, 0, 0.25);
    }

    &.${switchClasses.checked} {
      .${switchClasses.thumb} {
        left: 17px;
        top: 3px;
        background-color: #fff;
      }

      .${switchClasses.track} {
        background: ${orange[500]};
      }
    }

    & .${switchClasses.input} {
      cursor: inherit;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      opacity: 0;
      z-index: 1;
      margin: 0;
    }
    `
);

const AccountSettings = () => {
  const history = useHistory();
  const wallet = useWallet();
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [isEdit, setEdit] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [modeAnonymous, setModeAnonymous] = useState(false);

  const getUsername = useCallback(async () => {
    const userInfo = await wallet.getUserInfo(false);
    setUsername(userInfo.username);
    setNickname(userInfo.nickname);
    setAvatar(userInfo.avatar);
  }, [wallet]);

  const toggleEdit = () => {
    setEdit(!isEdit);
  };

  const getAnonymousMode = useCallback(async () => {
    // const domain = await wallet.fetchUserDomain();
    // if (domain) {
    //   setDomain(domain);
    // } else {
    //   setShowPop(true);
    // }
    const userInfo = await wallet.fetchUserInfo();
    if (userInfo.private === 1) {
      setModeAnonymous(false);
    } else {
      setModeAnonymous(true);
    }
  }, [wallet]);

  const updatePreference = useCallback(
    async (modeAnonymous) => {
      if (modeAnonymous) {
        await wallet.updateProfilePreference(2);
      } else {
        await wallet.updateProfilePreference(1);
      }
      await getAnonymousMode();
    },
    [getAnonymousMode, wallet]
  );

  const refreshUsername = useCallback(async () => {
    const userInfo = await wallet.getUserInfo(true);
    setUsername(userInfo.username);
  }, [wallet]);

  const switchAnonymousMode = useCallback(async () => {
    await updatePreference(!modeAnonymous);
  }, [updatePreference, modeAnonymous]);

  useEffect(() => {
    getAnonymousMode();
    getUsername();
  }, [getAnonymousMode, getUsername]);

  return (
    <div className="page">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'auto',
          px: '16px',
        }}
      >
        <IconButton>
          <ArrowBackIcon
            fontSize="medium"
            sx={{ color: 'icon.navi', cursor: 'pointer' }}
            onClick={() => history.push('/dashboard')}
          />
        </IconButton>
        <Typography
          variant="h1"
          sx={{
            py: '14px',
            alignSelf: 'center',
            fontSize: '20px',
          }}
        >
          {chrome.i18n.getMessage('Profile')}
        </Typography>
        <IconButton>
          <EditRoundedIcon
            fontSize="medium"
            sx={{ color: 'icon.navi', cursor: 'pointer' }}
            onClick={() => {
              toggleEdit();
            }}
          />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Avatar sx={{ width: '88px', height: '88px', marginBottom: '10px' }} src={avatar} />
        <Box sx={{ display: 'flex', justifyContent: 'center', color: '#fff' }}>
          <Typography
            display="inline"
            sx={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#E6E6E6',
              textAlign: 'center',
            }}
          >
            {nickname}
          </Typography>
        </Box>
        <Typography
          display="inline"
          sx={{
            fontWeight: 'normal',
            fontSize: '12px',
            color: '#BABABA',
            textAlign: 'center',
            marginBottom: '15px',
          }}
          variant="body2"
        >
          @{username}
        </Typography>
        <Box
          sx={{
            width: 'auto',
            margin: '10px auto',
            padding: '0 20px',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#282828',
              display: 'flex',
              padding: '20px 24px',
              justifyContent: 'space-between',
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
                {chrome.i18n.getMessage('Anonymous')}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ weight: 400, fontSize: '12px' }}
              >
                {chrome.i18n.getMessage(
                  'Other__Lilico__users__cannot__search__for__your__username'
                )}
              </Typography>
            </Box>
            <Switch
              checked={modeAnonymous}
              slots={{
                root: Root,
              }}
              onChange={() => {
                switchAnonymousMode();
              }}
            />
          </Box>
          {/* {domain && <Box sx={{
            backgroundColor: '#282828',
            width: '100%',
            marginTop:'10px',
            display: 'flex',
            padding:'20px 24px',
            justifyContent: 'space-between',
            borderRadius: '16px',
          }}>
            <Box sx={{display: 'flex', flexDirection: 'column'}}>
              <Typography variant='body1' color='primary.contrastText' style={{weight: 600}}>Lilico Domain</Typography>
              <Typography variant="caption" color='text.secondary' sx={{weight: 400, fontSize: '12px'}}>
                {username}.meow
              </Typography>
            </Box>
            <CheckCircleIcon
              size={24}
              color={'#41CC5D'}
            />
          </Box>
          } */}
          {/* {showPop &&
            <Box sx={{display:'flex',justifyContent:'space-between',
            //  width:'100%',
              alignItems: 'center',
              border: '1px solid #FFFFFF',
              borderRadius:'12px',
              padding:'0px 15px 0px 0px',
              marginTop: '16px',
              backgroundImage:`url(${bannerbackground})`,
              backgroundSize: '370px, 60px'

            }}
            >
              <Box
                sx={{
                  width: '254px',
                  height: '46px',
                  // backgroundColor:'#333333',
                  // borderRadius:'12px',
                  display:'flex',
                  alignItems: 'center',
                  paddingLeft:'16px'
                }}
              >
                <Typography
                  variant="body2"
                  align="left"
                  paddingTop="18px"
                  paddingBottom="15px"
                  color="#FFFFFF"
                  fontSize="12px"
                >
                  {chrome.i18n.getMessage('Claim__for__your')}
                  <Typography
                    display="inline"
                    sx={{
                      fontWeight: 'bold',
                      fontSize:'12px',
                      color:'#FFFFFF'
                    }}
                    variant="body2"
                  >
                    {chrome.i18n.getMessage('FREE')}
                  </Typography>{' '}{chrome.i18n.getMessage('Lilico__domain')}
                </Typography>
              </Box>
            </Box>
          } */}
          <EditAccount
            isEdit={isEdit}
            handleCloseIconClicked={() => toggleEdit()}
            handleCancelBtnClicked={() => toggleEdit()}
            handleAddBtnClicked={() => {
              toggleEdit();
              refreshUsername();
            }}
            nickname={nickname}
            setNickname={setNickname}
            avatar={avatar}
          />
        </Box>
      </Box>
    </div>
  );
};

export default AccountSettings;
