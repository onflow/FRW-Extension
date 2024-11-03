import { useEffect, useState, useContext } from 'react';
import IconGoogleDrive from '../../../../components/iconfont/IconGoogleDrive';
import React from 'react';
import { Box, Button, Typography, TextField, TextareaAutosize } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LLSpinner } from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';
import { useHistory } from 'react-router-dom';


const useStyles = makeStyles((theme) => ({
  form: {
    width: '100%', // Fix full width
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%', // Fix full width
    borderRadius: '16px',
    backgroundColor: '#2C2C2C',
    padding: '20px',
    color: '#fff',
    marginBottom: '16px',
    resize: 'none',
    fontSize: '16px',
    fontFamily: 'Inter',
  },
  button: {
    width: '100%', // Fix full width
    fontWeight: 'bold',
  },
}));
const Googledrive = ({ setErrorMessage, setShowError }) => {
  // const classes = useStyles();
  const classes = useStyles();
  const wallets = useWallet();
  const history = useHistory();

  const [loading, setLoading] = useState(false);

  const getGoogle = async () => {
    setLoading(true);

    try {
      const accounts = await wallets.loadBackupAccounts();
      if (accounts.length > 0) {
        history.push({
          pathname: '/import/google',
          state: {
            accounts: accounts,
          },
        });
      } else {
        setShowError(true)
        setErrorMessage(chrome.i18n.getMessage('No__backup__found'))
      }
      setLoading(false);
    } catch (e) {
      console.log(e);
      setShowError(true)
      setErrorMessage(chrome.i18n.getMessage('Something__is__wrong'))
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '0' }}>
      <Box sx={{display:'flex',flexDirection:'column',justifyContent:'space-between',alignItems:'center', backgroundColor:'#2C2C2C',borderRadius:'16px', py:'40px'}}>
        <IconGoogleDrive style={{backgroundColor:'#fff', width:'73px',height:'73px',padding:'8px',borderRadius:'73px'}} />
        <Typography
          variant="body1"
          color="text.primary"
          sx={{fontSize:'18px',paddingTop:'18px',fontWeight:'700'}}
        >
          {chrome.i18n.getMessage('Restore__Backup__from__Google__Drive')}
        </Typography>
        <Button
          className="registerButton"
          variant="contained"
          color="success"
          size="large"
          sx={{
            px: '24px',
            py: '12px',
            marginBottom: '15px',
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0px 24px 24px rgba(0,0,0,0.36)',
            mt: '36px',
            width:'404px'
          }}
          onClick={getGoogle}
          startIcon={
            loading && <LLSpinner size={20} />
          }
        >
          <Typography
            variant="body1"
            sx={{color:'#222',fontSize:'20px',fontWeight:'600'}}
          >
            {chrome.i18n.getMessage('Connect')}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default Googledrive;
