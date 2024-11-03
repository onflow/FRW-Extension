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
import { useLocation } from 'react-router-dom';

interface LocationState {
  deviceItem?: any;
}

const DeviceInfo = () => {
  const usewallet = useWallet();
  const history = useHistory();

  const [showError, setShowError] = useState(false);
  const location = useLocation<LocationState>();
  const wallet = useWallet();
  const [devices, setDevices] = useState<any>({})


  const getDevice = async () => {

    const deviceItem = location.state?.deviceItem;
    setDevices(deviceItem)
  }

  const setTab = async () => {
    await wallet.setDashIndex(3);
  };


  useEffect(() => {
    setTab();
    getDevice();
  }, []);

  const formatDate = (dateString) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const date = new Date(dateString);
    const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    return formattedDate;
  }


  return (
    <div className="page">
      <LLHeader title={'Device Info'} help={false} />
      <Box sx={{
        display: 'flex',
        height: 'auto',
        position: 'relative',
        zIndex: '5',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out',
        flexDirection: 'column',
        padding: '0 18px'
      }}>
        {devices &&
          <Box sx={{
            display: 'flex',
            height: 'auto',
            position: 'relative',
            overflow: 'hidden',
            flexDirection: 'column',
            backgroundColor: '#2C2C2CBF',
            borderRadius: '16px',
            padding: '0 16px'
          }}>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <Typography
                sx={{
                  color: '#FFFFFFCC',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {chrome.i18n.getMessage('Application')}
              </Typography>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {devices.device_name}
              </Typography>

            </Box>
            <Box sx={{ width: '100%', height: '1px', background: ' rgba(255, 255, 255, 0.12)' }}></Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <Typography
                sx={{
                  color: '#FFFFFFCC',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {chrome.i18n.getMessage('IP_Address')}
              </Typography>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {devices.ip}
              </Typography>

            </Box>
            <Box sx={{ width: '100%', height: '1px', background: ' rgba(255, 255, 255, 0.12)' }}></Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <Typography
                sx={{
                  color: '#FFFFFFCC',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {chrome.i18n.getMessage('Location')}
              </Typography>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {devices.city}, {devices.countryCode}
              </Typography>

            </Box>
            <Box sx={{ width: '100%', height: '1px', background: ' rgba(255, 255, 255, 0.12)' }}></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <Typography
                sx={{
                  color: '#FFFFFFCC',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {chrome.i18n.getMessage('Date')}
              </Typography>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '14px',
                  fontWeight: 400,
                }}>
                {formatDate(devices.updated_at)}
              </Typography>

            </Box>

          </Box>
        }
      </Box>
    </div >
  )
}

export default DeviceInfo;