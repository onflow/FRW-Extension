import React,{ useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import {Typography,Button} from '@mui/material';
import{Input,FormControl} from '@mui/material';
import { useWallet } from 'ui/utils';
import { LLHeader } from '@/ui/FRWComponent';
import CancelIcon from '../../../../components/iconfont/IconClose';
import { Presets } from 'react-component-transition';
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

const PrivateKeyPassword = () => {
  const wallet = useWallet();
  const classes = useStyles();
  const history = useHistory();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isMatch, setMatch] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.keyCode === 32) {
      event.preventDefault();
    }
  };

  const verify = async () => {
    setMatch(false);

    if (confirmPassword.length > 7) {
      wallet.getCurrentPassword(confirmPassword).then(() => {
        setMatch(true);
      }).catch(() => {
        setMatch(false);
      });
    }
  }

  const setTab = async () => {
    await wallet.setDashIndex(3);
  };

  const navigate = async () => {
    history.push({
      pathname: '/dashboard/nested/keydetail',         
      state: {
        password: confirmPassword,
      },});
  }


  useEffect(() => {
    setTab();
  }, []);

  useEffect(() => {
    verify();
  }, [confirmPassword]);

  const passwordError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={14} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography color={'#E54040'} sx={{color:'#E54040'}}>
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
        <LLHeader title={chrome.i18n.getMessage('Verify__Password')}  help={false}/>

        <FormControl sx={{ flexGrow: 1, width: '90%', display: 'flex', flexDirection: 'column', margin: '0 auto', paddingTop: '12px'}}>
          <Input
            id="textfield"
            type="password"
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
            autoFocus
            fullWidth
            disableUnderline
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
            onKeyDown={handleKeyDown} 
          />

          <Presets.TransitionSlideUp>
            {confirmPassword && !isMatch && (
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
            )} 
          </Presets.TransitionSlideUp>

          {/* <Box sx={{flexGrow: 1}}/> */}

        
          <Presets.TransitionFade>
            <Box
              sx={{
                backgroundColor: 'rgba(247, 87, 68, 0.1)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                my:'18px',
                padding: '16px',
              }}>
              <Typography
                sx={{
                  alignSelf: 'center',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  lineHeight: '16px',
                  color: '#E54040',
                  paddingBottom: '16px',
                  paddingTop: '0px'
                }}
              >
                {chrome.i18n.getMessage('Do__not__share__your__private__key')}
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
                {chrome.i18n.getMessage('If__someone__has__your__private__key')}
              </Typography>
            </Box>
          </Presets.TransitionFade>

        </FormControl>

        <Box sx={{ flexGrow: 1}}/>

        <Box
          sx={{
            display: 'flex',
            px: '18px',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '40px'

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
              sx={{ fontWeight: '600',
                fontSize: '14px', fontFamily:'Inter',
                fontColor:'#E6E6E6',
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
            disabled={!isMatch}
          >
            <Typography
              sx={{ fontWeight: '600',
                fontSize: '14px', fontFamily:'Inter'}}
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

export default PrivateKeyPassword;