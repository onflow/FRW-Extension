import { Typography, Button, Input, FormControl } from '@mui/material';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import CancelIcon from '@/components/iconfont/IconClose';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { LLHeader } from '@/ui/FRWComponent';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';

import { useWallet } from '../utils';

import { PasswordInput } from './PasswordComponents';

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

type PassMatch = 'match' | 'no-match' | 'unverified';
const SettingsPassword = ({
  verifiedUrl,
  children = null,
}: {
  verifiedUrl: string;
  children?: ReactNode;
}) => {
  const wallet = useWallet();
  const classes = useStyles();
  const history = useHistory();
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [passMatch, setPassMatch] = useState<PassMatch>('unverified');

  const verify = useCallback(() => {
    setPassMatch('unverified');

    if (password.length > 7) {
      wallet
        .verifyPassword(password)
        .then(() => {
          setPassMatch('match');
        })
        .catch(() => {
          setPassMatch('no-match');
        });
    }
  }, [password, wallet]);

  const navigate = useCallback(async () => {
    history.replace({
      pathname: verifiedUrl,
      state: {
        password: password,
      },
    });
  }, [history, verifiedUrl, password]);

  useEffect(() => {
    verify();
  }, [password, verify]);

  const passwordError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={14} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography color={'#E54040'} sx={{ color: '#E54040' }}>
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
            value={password}
            onChange={(value) => {
              setPassword(value);
            }}
            isVisible={isPasswordVisible}
            setVisible={setPasswordVisible}
            className={classes.inputBox}
            autoFocus={true}
            placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
          />

          <SlideRelative direction="down" show={!!password && passMatch === 'no-match'}>
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
          </SlideRelative>
          {children}
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
            onClick={navigate}
            size="large"
            sx={{
              display: 'flex',
              flexGrow: 1,
              height: '48px',
              borderRadius: '8px',
              textTransform: 'capitalize',
              width: '100%',
            }}
            disabled={passMatch !== 'match'}
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

export default SettingsPassword;
