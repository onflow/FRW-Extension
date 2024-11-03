import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  IconButton,
  Box,
  Link,
  CardMedia
} from '@mui/material';
import {
  LLPrimaryButton,
  LLSpinner
} from 'ui/FRWComponent';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import '../../Unlock/style.css';
import enableBg from 'ui/FRWAssets/image/enableBg.png';
// import enableBg from 'ui/FRWAssets/svg/enableBg.svg';
import { useWallet } from 'ui/utils';


const Enable = () => {
  const expiry_time = 60000;
  const history = useHistory();
  const wallet = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState('');
  const [enough, setEnough] = useState(false);

  const handleClaiming = async () => {
    setClaiming(true);
    wallet.createCoaEmpty().then(async (createRes) => {
      wallet.listenTransaction(createRes, true, 'Create EVM complete', `Your EVM on Flow address has been created. \nClick to view this transaction.`);
      await wallet.setDashIndex(0);
      history.push('/dashboard?activity=1');

      setClaiming(false);
    }).catch((err) => {
      console.log(err);
      setClaiming(false);
    });


  };

  const getUsername = async () => {
    const storageData = await wallet.getCoinList(expiry_time);
    const flowToken = storageData.find(token => token.unit === 'flow');
    if (flowToken!.balance >= 0.002) {
      setEnough(true);
    }
  };

  useEffect(() => {
    getUsername();
  }, []);

  return (
    <Box sx={{
      width: '100%', height: '100%', display: 'flex', backgroundColor: '#121212', flexDirection: 'column'
    }}>
      <Box sx={{
        display: 'flex',
        padding: '20px 0 0',
        marginLeft: '18px',
        justifyContent: 'space-between'
      }}
      >
        <IconButton onClick={history.goBack}>
          <ArrowBackIcon sx={{
            color: 'icon.navi',
          }} />
        </IconButton>

      </Box>


      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>

        <CardMedia component="img" sx={{ width: '196px', height: '196px' }} image={enableBg} />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            color: '#E6E6E6',
            textAlign: 'Montserrat',
            fontFamily: 'Inter',
            fontSize: '20px',
            mt: '20px',
            width: '168px'
          }}
          color="error"
        >
          {chrome.i18n.getMessage('enable_the_path_to_evm_on_flow')}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 'normal', color: '#bababa', textAlign: 'center', fontSize: '14px' }}
          color="error"
        >
          {chrome.i18n.getMessage('manage_multi_assets_seamlessly')}
        </Typography>

      </Box>
      <Box sx={{ padding: '18px' }}>
        {claiming ? (
          <Box
            sx={{
              borderRadius: '12px',
              height: '50px',
              width: '100%',
              fontSize: '18px',
              textTransform: 'none !important',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#FFFFFFCC',
              alignItems: 'center',
            }}
          >
            {failed ?
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', fontSize: '14px' }}
                color="error"
              >
                {chrome.i18n.getMessage('Submission_error') + error}
              </Typography>
              :
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                <LLSpinner size={28} />
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold' }}
                  color="background.paper"
                >
                  {chrome.i18n.getMessage('Working_on_it')}
                </Typography>
              </Box>
            }
          </Box>
        ) : (
          <LLPrimaryButton
            label={chrome.i18n.getMessage('Enable')}
            onClick={handleClaiming}
            sx={{
              borderRadius: '14px',
              height: '50px',
              width: '100%',
              fontSize: '18px',
              fontWeight: '700',
              textTransform: 'none !important',
            }}
          />
        )}
      </Box>
      <Box
        sx={{
          borderRadius: '12px',
          fontSize: '18px',
          textTransform: 'none !important',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '48px'
        }}
      >
        <Link href="https://flow.com/upgrade/crescendo/evm" target="_blank" underline="none" sx={{ textDecoration: 'none' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'normal', fontSize: '14px', color: 'rgba(255, 255, 255, 0.80)' }}
          >
            {chrome.i18n.getMessage('Learn__more')}
          </Typography>
        </Link>
      </Box>
    </Box >
  );
};

export default Enable;
