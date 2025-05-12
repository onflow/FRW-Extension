import { Input, FormControl, Typography, Button, Fade } from '@mui/material';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { LLHeader } from '@/ui/FRWComponent';
import { PasswordInput } from '@/ui/FRWComponent/PasswordComponents';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';
import { useWallet } from 'ui/utils';

import CancelIcon from '../../../../components/iconfont/IconClose';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    // magrinBottom: '64px',
    zIndex: '999',
    backgroundColor: '#121212',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));

const Recoveryphrasepassword = () => {
  const history = useHistory();
  const wallet = useWallet();
  const classes = useStyles();
  const [confirmPassword, setConfirmPassword] = useState(DEFAULT_PASSWORD);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isMatch, setMatch] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.keyCode === 32) {
      event.preventDefault();
    }
  };

  const verify = useCallback(() => {
    setMatch(false);

    if (confirmPassword.length > 7) {
      wallet
        .verifyPassword(confirmPassword)
        .then(() => {
          setMatch(true);
        })
        .catch(() => {
          setMatch(false);
        });
    }
  }, [confirmPassword, wallet]);

  const setTab = useCallback(async () => {
    await wallet.setDashIndex(3);
  }, [wallet]);

  const navigate = useCallback(async () => {
    history.push({
      pathname: '/dashboard/nested/recoveryphrasedetail',
      state: {
        password: confirmPassword,
      },
    });
  }, [confirmPassword, history]);

  useEffect(() => {
    setTab();
  }, [setTab]);

  useEffect(() => {
    verify();
  }, [confirmPassword, verify]);

  const passwordError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={14} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography variant="body2" color={'#E54040'}>
        {chrome.i18n.getMessage('Incorrect__Password')}
      </Typography>
    </Box>
  );

  return (
    <div className="page">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <LLHeader title={chrome.i18n.getMessage('Verify__Password')} help={false} />

        <FormControl
          sx={{
            flexGrow: 1,
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto',
            paddingTop: '12px',
          }}
        >
          <PasswordInput
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
            }}
            isVisible={isPasswordVisible}
            setVisible={setPasswordVisible}
            className={classes.inputBox}
            autoFocus={true}
            placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
            onKeyDown={handleKeyDown}
          />

          <SlideRelative show={!!(confirmPassword && !isMatch)} direction="down">
            <>
              <Box
                sx={{
                  width: '95%',
                  backgroundColor: 'error.light',
                  mx: 'auto',
                  borderRadius: '0 0 12px 12px',
                }}
              >
                <Box sx={{ p: '4px' }}>{passwordError()}</Box>
              </Box>
            </>
          </SlideRelative>

          {/* <Box sx={{flexGrow: 1}}/> */}

          <Fade in={true}>
            <Box
              sx={{
                backgroundColor: 'rgba(247, 87, 68, 0.1)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                my: '18px',
                padding: '16px',
              }}
            >
              <Typography
                sx={{
                  alignSelf: 'center',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  lineHeight: '16px',
                  color: '#E54040',
                  paddingBottom: '16px',
                  paddingTop: '0px',
                }}
              >
                {chrome.i18n.getMessage('Do__not__share__your__secret__phrase')}
              </Typography>
              <Typography
                sx={{
                  alignSelf: 'center',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  lineHeight: '16px',
                  color: '#E54040',
                  textAlign: 'center',
                }}
              >
                {chrome.i18n.getMessage('If__someone__has__your__secret__phrase')}
              </Typography>
            </Box>
          </Fade>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        <Box
          sx={{
            display: 'flex',
            px: '18px',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '40px',
          }}
        >
          <Button
            variant="contained"
            component={Link}
            to="/dashboard"
            size="large"
            sx={{
              backgroundColor: '#333333',
              display: 'flex',
              flexGrow: 1,
              height: '48px',
              width: '100%',
              borderRadius: '8px',
              textTransform: 'capitalize',
            }}
          >
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: 'Inter',
                fontColor: '#E6E6E6',
              }}
            >
              {chrome.i18n.getMessage('Cancel')}
            </Typography>
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              display: 'flex',
              flexGrow: 1,
              height: '48px',
              borderRadius: '8px',
              textTransform: 'capitalize',
              width: '100%',
            }}
            onClick={navigate}
            disabled={!isMatch}
          >
            <Typography
              sx={{ fontWeight: '600', fontSize: '14px', fontFamily: 'Inter' }}
              color="text.primary"
            >
              {chrome.i18n.getMessage('Next')}
            </Typography>
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Recoveryphrasepassword;
