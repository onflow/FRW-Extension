// import { useTranslation } from 'react-i18next';
import { Input, Typography, Box, FormControl, List, ListItem, ListItemText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useEffect, useRef, useState } from 'react';

import { consoleError } from '@/shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { PasswordInput } from '@/ui/FRWComponent/PasswordComponents';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';
import { LLPrimaryButton, CredentialBox, LLSecondaryButton } from 'ui/FRWComponent';
import { useWallet, useApproval, useWalletRequest } from 'ui/utils';

import CancelIcon from '../../../components/iconfont/IconClose';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    magrinBottom: '64px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));

const RetrievePK = () => {
  const wallet = useWallet();
  const classes = useStyles();
  const [, resolveApproval] = useApproval();
  const inputEl = useRef<any>(null);
  // const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [dataArray, setArray] = useState<any[]>([]);
  const [retrieved, setRetrieved] = useState(false);
  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const run = async (password) => {
    const result = await wallet.retrievePk(password);
    setArray(result);
    setRetrieved(true);
    setLoading(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      setLoading(true);
      run(password);
    }
  };

  const handleClick = () => {
    setLoading(true);
    run(password);
  };

  const copyAll = () => {
    // Extract 'value' from each item and join them with a space
    const allValues = dataArray.map((item, index) => `${index + 1}: ${item.value};`).join(' ');

    navigator.clipboard
      .writeText(allValues)
      .catch((err) => consoleError('Failed to copy to clipboard: ', err));
  };

  const usernameError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography variant="body1" color="text.secondary">
        {chrome.i18n.getMessage('Incorrect__Password')}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        backgroundColor: '#282828',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* <Logo size={90} style={{marginTop:'120px'}}/> */}

      {/* <img  style={{paddingTop:'108px' }} src={lilicoIcon} /> */}
      {!dataArray.length && !retrieved && (
        <>
          <Box
            padding="18px"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box>
              <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="24px">
                Retrieve your mnemonic and key.
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontStyle: 'normal',
                  color: '#BABABA',
                  textAlign: 'center',
                  margin: '18px 36px 52px',
                  cursor: 'pointer',
                }}
              >
                Enter the password you last used to retrieve the key stored on this machine.
              </Typography>
            </Box>
          </Box>

          <FormControl sx={{ flexGrow: 1, width: '90%', display: 'flex', flexDirection: 'column' }}>
            <PasswordInput
              value={password}
              onChange={(value) => {
                setShowError(false);
                setPassword(value);
              }}
              isVisible={isPasswordVisible}
              setVisible={setPasswordVisible}
              className={classes.inputBox}
              autoFocus={true}
              placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
              onKeyDown={handleKeyDown}
            />

            <SlideRelative direction="down" show={showError}>
              <Box
                sx={{
                  width: '95%',
                  backgroundColor: 'error.light',
                  mx: 'auto',
                  borderRadius: '0 0 12px 12px',
                }}
              >
                <Box sx={{ p: '4px' }}>{usernameError()}</Box>
              </Box>
            </SlideRelative>
          </FormControl>
        </>
      )}

      {dataArray.length > 0 && (
        <List
          sx={{
            maxHeight: '80%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            padding: '18px',
            marginBottom: '30px',
          }}
        >
          {dataArray.map((item) => (
            <ListItem key={item.index}>
              <ListItemText
                primary={`${item.keyType}`}
                secondary={<CredentialBox data={item.value} />}
              />
            </ListItem>
          ))}
        </List>
      )}

      {!dataArray.length && !retrieved ? (
        <Box sx={{ width: '90%', marginBottom: '16px' }}>
          <LLPrimaryButton
            // className="w-full block"\
            color="success"
            type="submit"
            onClick={handleClick}
            fullWidth
            label={isLoading ? 'Loading...' : 'Retrieve Wallet'}
          />
        </Box>
      ) : (
        <Box sx={{ width: '90%', marginBottom: '16px' }}>
          <LLPrimaryButton
            // className="w-full block"\
            color="success"
            type="submit"
            onClick={copyAll}
            fullWidth
            label={'Copy all'}
          />
          <LLSecondaryButton
            // className="w-full block"\
            color="success"
            type="submit"
            onClick={() => history.go(-1)}
            fullWidth
            label={'Cancel'}
            sx={{ marginTop: '8px' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default RetrievePK;
