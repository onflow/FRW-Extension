import React, { useEffect, useRef, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { useWallet, useApproval, useWalletRequest } from 'ui/utils';
import { Typography, Box, FormControl, List, ListItem, ListItemText } from '@mui/material';
import { LLPrimaryButton, CredentialBox, LLSecondaryButton } from 'ui/FRWComponent'
import { Input } from '@mui/material';
import { Presets } from 'react-component-transition';
import CancelIcon from '../../../components/iconfont/IconClose';
import { makeStyles } from '@mui/styles';

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
  const [isLoading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [dataArray, setArray] = useState<any[]>([]);
  const [retrieved, setRetrieved] = useState(false);
  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);



  const run = async (password) => {
    const result = await wallet.retrievePk(password);
    console.log('result ', result);
    setArray(result);
    setRetrieved(true);
    setLoading(false);
  };


  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      setLoading(true);
      run(password)
    }
  };

  const handleClick = () => {
    setLoading(true);
    run(password);
  };

  const copyAll = () => {
    // Extract 'value' from each item and join them with a space
    const allValues = dataArray.map((item, index) => `${index + 1}: ${item.value};`).join(' ');

    navigator.clipboard.writeText(allValues)
      .then(() => console.log("Copied to clipboard successfully!"))
      .catch(err => console.error("Failed to copy to clipboard: ", err));
  }

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
        height: '100vh', width: '100%', backgroundColor: '#282828', display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
      {/* <Logo size={90} style={{marginTop:'120px'}}/> */}


      {/* <img  style={{paddingTop:'108px' }} src={lilicoIcon} /> */}
      {(!dataArray.length && !retrieved) && (
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
              <Typography
                variant="h1"
                align="center"
                py="14px"
                fontWeight="bold"
                fontSize="24px"
              >
                Retrieve your mnemonic and key.
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px', fontFamily: 'Inter',
                  fontStyle: 'normal', color: '#BABABA', textAlign: 'center', margin: '18px 36px 52px', cursor: 'pointer'
                }}
              >
                Enter the password you last used to retrieve the key stored on this machine.
              </Typography>
            </Box>
          </Box>

          <FormControl sx={{ flexGrow: 1, width: '90%', display: 'flex', flexDirection: 'column' }}>
            <Input
              id="textfield"
              type="password"
              className={classes.inputBox}
              placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
              autoFocus
              fullWidth
              disableUnderline
              value={password}
              onChange={(event) => {
                setShowError(false);
                setPassword(event.target.value);
              }}
              onKeyDown={handleKeyDown}
            />

            <Presets.TransitionSlideUp>
              {showError && (
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
              )}
            </Presets.TransitionSlideUp>
          </FormControl>
        </>
      )}


      {dataArray.length > 0 &&
        <List sx={{
          maxHeight: '80%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          padding: '18px',
          marginBottom: '30px'
        }}>
          {dataArray.map(item => (
            <ListItem key={item.index}>
              <ListItemText primary={`${item.keyType}`} secondary={<CredentialBox data={item.value} />} />
            </ListItem>
          ))}
        </List>
      }

      {(!dataArray.length && !retrieved) ?

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
        :

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
            sx={{marginTop:'8px'}}
          />
        </Box>
      }



    </Box>
  );
};

export default RetrievePK;