import React, { useEffect, useRef, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { useWallet, useApproval, useWalletRequest } from 'ui/utils';
import{Typography, Box, FormControl} from '@mui/material';
import { LLPrimaryButton, LLResetPopup } from 'ui/FRWComponent'
import{Input} from '@mui/material';
import { Presets } from 'react-component-transition';
import CancelIcon from '../../../components/iconfont/IconClose';
import { makeStyles } from '@mui/styles';
import { openInternalPageInTab } from 'ui/utils/webapi';
import lilo from 'ui/FRWAssets/image/lilo.png';
import './style.css';

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

const Unlock = () => {
  const wallet = useWallet();
  const classes = useStyles();
  const [, resolveApproval] = useApproval();
  const inputEl = useRef<any>(null);
  // const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [password, setPassword] = useState('');
  const [resetPop, setResetPop] = useState<boolean>(false);

  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const restPass = async () => {
    // setResetPop(true);
    await wallet.lockWallet();
    openInternalPageInTab('forgot');
  };

  const [run] = useWalletRequest(wallet.unlock, {
    onSuccess() {
      resolveApproval('unlocked');
    },
    onError() {
      setShowError(true)
    },
  });

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      run(password)
    }
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
      sx={{height: '100vh',  width: '100%', backgroundColor: '#282828', display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'}}>
      {/* <Logo size={90} style={{marginTop:'120px'}}/> */}

      <Box className="logoContainer" sx={{marginTop:'60px'}}>
        <img src={lilo} style={{ height: '100%', width: '100%'}} />
      </Box>

      {/* <img  style={{paddingTop:'108px' }} src={lilicoIcon} /> */}
      <Box sx={{ width: '100%', 
        textAlign:'center'}}>
        <Typography sx={{
          fontWeight:'700',
          fontSize:'26px', 
          fontFamily:'Inter', 
          fontStyle:'normal',
          pt:'30px', 
          pb: '30px'
        }}>
          {chrome.i18n.getMessage('Welcome__Back__Unlock')}
        </Typography>
      </Box>

      <FormControl sx={{ flexGrow: 1, width: '90%', display: 'flex', flexDirection: 'column'}}>
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
            setShowError(false)
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

        {/* <Box sx={{flexGrow: 1}}/> */}
      </FormControl>


      <Box sx={{width: '90%', marginBottom: '32px'}}>
        <LLPrimaryButton
          // className="w-full block"\
          color="success"
          type="submit"
          onClick={()=> run(password)}
          fullWidth
          label= {chrome.i18n.getMessage('Unlock_Wallet')}
          // sx={{marginTop: '40px', height: '48px'}}
          // type="primary"
          // size="large"
        />
        <Typography onClick={restPass}sx={{fontSize:'14px', fontFamily:'Inter', 
          fontStyle:'normal', color:'neutral1.main', textAlign:'center', marginTop:'16px', cursor:'pointer', fontWeight:'600'}}>
          {chrome.i18n.getMessage('Forgot_password')}
        </Typography>
      </Box>

      <LLResetPopup
        resetPop={resetPop}
        handleCloseIconClicked={() => setResetPop(false)}
        handleCancelBtnClicked={() => setResetPop(false)}
        handleAddBtnClicked={() => {
          setResetPop(false);
        }}
      />

    </Box>
  );
};

export default Unlock;