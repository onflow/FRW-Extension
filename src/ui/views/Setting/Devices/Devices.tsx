import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { styled } from '@mui/system';
import SwitchUnstyled, { switchUnstyledClasses } from '@mui/core/SwitchUnstyled';
import { makeStyles } from '@mui/styles';
import {
  Box,
  Typography,
  Checkbox,
  CardActionArea,
  Divider,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { useWallet } from 'ui/utils';
import { LLHeader, LLPrimaryButton } from '@/ui/FRWComponent';
import Pc from '../../../FRWAssets/image/pc.png';
import Mobile from '../../../FRWAssets/image/mobile.png';
import circlecheck from '../../../FRWAssets/image/circlecheck.png';
import goto from '../../../FRWAssets/image/goto.png';
import QR from '../../../FRWAssets/image/QR2.png';
import WalletConnect from './WalletConnect';


const Devices = () => {
  const usewallet = useWallet();
  const history = useHistory();

  const [showError, setShowError] = useState(false);

  const wallet = useWallet();
  const [privatekey, setKey] = useState('');
  const [publickey, setPublicKey] = useState('')
  const [showKey, setShowkey] = useState(null)
  const [devices, setDevices] = useState<any[]>([])
  const [currentId, setCurrentId] = useState<string>('')
  const [qrCode, setShowQr] = useState<boolean>(false)


  const getDevice = async () => {
    const installationId = await usewallet.openapi.getInstallationId();
    console.log(' installationId ', installationId)
    setCurrentId(installationId);
    const devices = await usewallet.openapi.deviceList();
    if (devices.data) {
      setDevices(devices.data)
    }
  }

  const setTab = async () => {
    await wallet.setDashIndex(3);
  };

  const toggleKey = async (index) => {
    if (showKey === index) {
      setShowkey(null)
    } else {
      setShowkey(index)
    }
  };

  const toggleQr = async () => {
    setShowQr(true);
  };

  useEffect(() => {
    setTab();
    getDevice();
  }, []);

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Devices')} help={false} />
      <Typography
        sx={{
          color: 'var(--basic-foreground-white-8-text, rgba(255, 255, 255, 0.80))',
          textAlign: 'center',
          width: '320px',
          margin: '0 auto',
          /* Body2 */
          fontFamily: 'Inter',
          fontSize: '14px',
          fontStyle: 'normal',
          fontWeight: '400',
          lineHeight: '24px', /* 171.429% */
          letterSpacing: '-0.084px',
        }}
      >
        {chrome.i18n.getMessage('Link_Flow_Reference_Wallet_Mobile_by_Scanning')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          width: '324px',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: '0',
          backgroundColor: '#579AF2',
          padding: '8px 24px',
          borderRadius: '12px',
          margin: '24px auto'
        }}
        onClick={(() => toggleQr())}><img src={QR} style={{ width: '24px', height: '24px' }} /><Typography sx={{ fontSize: '14px', fontWeight: '600', color: '#000', marginLeft: '8px' }}>{chrome.i18n.getMessage('Sync_Mobile_Device')}</Typography></Box>
      <Box sx={{ width: '339px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}></Box>
      {
        devices
          .sort((a, b) => (a.id === currentId ? -1 : 1))
          .map((item, index) => (
            <Box key={item.id} sx={{ width: '100%', margin: '8px 0' }} onClick={() => {
              if (item.id !== currentId) {
                history.push({
                  pathname: '/dashboard/setting/deviceinfo',
                  state: { deviceItem: item }
                });
              }
            }}>
              {item.id === currentId && (
                <Typography
                  sx={{
                    color: '#FFFFFF66',
                    fontSize: '14px',
                    margin: '0 26px 8px',
                  }}
                >
                  {chrome.i18n.getMessage('Current_Sessions')}
                </Typography>
              )}
              {index == 1 && (
                <Typography
                  sx={{
                    color: '#FFFFFF66',
                    fontSize: '14px',
                    margin: '0 26px 8px',
                  }}
                >
                  {chrome.i18n.getMessage('Active_Sessions')}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  height: 'auto',
                  position: 'relative',
                  zIndex: '5',
                  overflow: 'hidden',
                  justifyContent: 'space-between',
                  padding: '16px',
                  margin: '0 26px 8px',
                  backgroundColor: '#2C2C2C',
                  borderRadius: '16px',
                }}
              >
                <Box sx={{ marginRight: '8px' }}>
                  <img src={item.device_type == '1' ? Pc : Mobile} style={{ width: '24px', height: '24px' }} />
                </Box>
                <Box sx={{
                  display: 'flex',
                  height: 'auto',
                  position: 'relative',
                  zIndex: '5',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out',
                  flexDirection: 'column',
                  flex: '1'
                }}>

                  <Typography
                    sx={{
                      color: '#FFF',
                      fontSize: '14px',
                      fontWeight: 400,
                    }}>
                    {item.device_name}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.40)',
                      fontSize: '10px',
                    }}>
                    {item.user_agent}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.40)',
                      fontSize: '10px',
                    }}>
                    {item.city}, {item.countryCode} {chrome.i18n.getMessage('Online')}
                  </Typography>
                </Box>
                {item.id === currentId ?
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'right', width: '16px' }}>
                    <img src={circlecheck} style={{ width: '16px', height: '16px' }} />
                  </Box>
                  :
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'right', width: '16px' }}>
                    <img src={goto} style={{ width: '4px', height: '8px' }} />
                  </Box>
                }
              </Box>
              {item.id === currentId && (
                <Box sx={{ padding: '24px 10px' }}>
                  <Box sx={{ width: '100%', height: '1px', backgroundColor: '#FFFFFF1F' }}></Box>
                </Box>
              )}
            </Box>
          ))
      }

      <WalletConnect
        isAddAddressOpen={qrCode}
        handleCloseIconClicked={() => setShowQr(false)}
        handleCancelBtnClicked={() => setShowQr(false)}
        handleAddBtnClicked={() => {
          setShowQr(false);
        }}
      />
    </div >
  )
}

export default Devices;