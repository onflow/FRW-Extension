import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import {
  Box,
  CardActionArea,
  Checkbox,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import storage from '@/shared/utils/storage';
import { LLHeader } from '@/ui/components';
import { useWallet } from '@/ui/hooks/use-wallet';

const DeveloperMode = () => {
  const usewallet = useWallet();
  const [developerModeOn, setDeveloperModeOn] = useState(false);
  const [emulatorFeatureEnabled, setEmulatorFeatureEnabled] = useState(false);
  const [emulatorModeOn, setEmulatorModeOn] = useState(false);
  const [currentNetwork, setNetwork] = useState('mainnet');
  const [currentMonitor, setMonitor] = useState('flowscan');

  const loadStuff = useCallback(async () => {
    const network = await usewallet.getNetwork();
    const developerMode = await storage.get('developerMode');
    const enableEmulatorMode = await usewallet.getFeatureFlag('emulator_mode');
    const emulatorMode = enableEmulatorMode ? await usewallet.getEmulatorMode() : false;
    const monitor = await usewallet.getMonitor();

    return { network, developerMode, enableEmulatorMode, emulatorMode, monitor };
  }, [usewallet]);

  useEffect(() => {
    let mounted = true;

    loadStuff().then(({ network, developerMode, enableEmulatorMode, emulatorMode, monitor }) => {
      if (!mounted) return;
      setNetwork(network);
      setDeveloperModeOn(developerMode);
      setEmulatorFeatureEnabled(enableEmulatorMode);
      setEmulatorModeOn(emulatorMode);
      setMonitor(monitor);
    });

    return () => {
      mounted = false;
    };
  }, [loadStuff]);

  const switchNetwork = async (network: string) => {
    // if (network === 'crescendo' && !isSandboxEnabled) {
    //   return;
    // }

    setNetwork(network);
    usewallet.switchNetwork(network);
  };

  const switchMonitor = async (domain: string) => {
    setMonitor(domain);
    usewallet.switchMonitor(domain);
  };

  const switchDeveloperMode = async () => {
    setDeveloperModeOn((prev) => {
      const newMode = !prev;
      // This should probably be done in the background
      storage.set('developerMode', newMode);
      return newMode;
    });
  };

  const switchEmulatorMode = async () => {
    // Check if the feature flag is enabled
    const enableEmulatorMode = await usewallet.getFeatureFlag('emulator_mode');
    if (!enableEmulatorMode) {
      return;
    }

    setEmulatorModeOn((prev) => {
      const newMode = !prev;
      usewallet.setEmulatorMode(newMode);
      return newMode;
    });
  };

  return (
    <Box sx={{ padding: '0', height: '100%' }}>
      <LLHeader
        title={chrome.i18n.getMessage('Developer__Settings')}
        help={false}
        goBackLink="/dashboard/setting"
      />

      <Box
        sx={{
          width: 'auto',
          height: 'auto',
          margin: '10px 20px',
          backgroundColor: '#282828',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
          {chrome.i18n.getMessage('Developer__Mode')}
        </Typography>
        <Switch
          checked={developerModeOn}
          onChange={() => {
            switchDeveloperMode();
          }}
        />
      </Box>
      {developerModeOn && (
        <Box sx={{ pb: '20px' }}>
          {emulatorFeatureEnabled && (
            <Box
              sx={{
                width: 'auto',
                height: 'auto',
                margin: '10px 20px',
                backgroundColor: '#282828',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'row',
                borderRadius: '16px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
                {chrome.i18n.getMessage('Emulator_Mode')}
              </Typography>
              <Switch
                checked={emulatorModeOn}
                onChange={() => {
                  switchEmulatorMode();
                }}
              />
            </Box>
          )}
          <Typography
            variant="h6"
            color="neutral.contrastText"
            sx={{
              weight: 500,
              marginLeft: '18px',
            }}
          >
            {chrome.i18n.getMessage('Switch__Network')}
          </Typography>
          <Box
            sx={{
              width: 'auto',
              borderRadius: '16px',
              backgroundColor: '#282828',
              margin: '10px 20px',
            }}
          >
            <CardActionArea
              sx={{
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                borderRadius: '16px',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
              onClick={() => switchNetwork('mainnet')}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignContent: 'space-between',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  label={chrome.i18n.getMessage('Mainnet')}
                  control={
                    <Checkbox
                      size="small"
                      icon={<CircleOutlinedIcon />}
                      checkedIcon={<CheckCircleIcon color="primary" />}
                      value="mainnet"
                      checked={currentNetwork === 'mainnet'}
                      onChange={() => switchNetwork('mainnet')}
                    />
                  }
                />

                {currentNetwork === 'mainnet' && (
                  <Typography
                    component="div"
                    variant="body1"
                    color="text.nonselect"
                    sx={{ margin: 'auto 0' }}
                  >
                    {chrome.i18n.getMessage('Selected')}
                  </Typography>
                )}
              </Box>
            </CardActionArea>

            <Divider sx={{ width: '90%', margin: '0 auto' }} />

            <CardActionArea
              sx={{
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                borderRadius: '16px',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
              onClick={() => switchNetwork('testnet')}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignContent: 'space-between',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  label={chrome.i18n.getMessage('Testnet')}
                  control={
                    <Checkbox
                      size="small"
                      icon={<CircleOutlinedIcon />}
                      checkedIcon={<CheckCircleIcon sx={{ color: '#FF8A00' }} />}
                      value="testnet"
                      checked={currentNetwork === 'testnet'}
                      onChange={() => switchNetwork('testnet')}
                    />
                  }
                />

                {currentNetwork === 'testnet' && (
                  <Typography
                    component="div"
                    variant="body1"
                    color="text.nonselect"
                    sx={{ margin: 'auto 0' }}
                  >
                    {chrome.i18n.getMessage('Selected')}
                  </Typography>
                )}
              </Box>
            </CardActionArea>
          </Box>

          <Typography
            variant="h6"
            color="neutral.contrastText"
            sx={{
              weight: 500,
              marginLeft: '18px',
            }}
          >
            {chrome.i18n.getMessage('Transaction__Monitor')}
          </Typography>
          <Box
            sx={{
              width: 'auto',
              borderRadius: '16px',
              backgroundColor: '#282828',
              margin: '10px 20px',
            }}
          >
            <CardActionArea
              sx={{
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                borderRadius: '16px',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
              onClick={() => switchMonitor('flowscan')}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignContent: 'space-between',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  label="Flowscan"
                  control={
                    <Checkbox
                      size="small"
                      icon={<CircleOutlinedIcon />}
                      checkedIcon={<CheckCircleIcon color="primary" />}
                      value="flowscan"
                      checked={currentMonitor === 'flowscan'}
                      onChange={() => switchMonitor('flowscan')}
                    />
                  }
                />

                {currentMonitor === 'flowscan' && (
                  <Typography
                    component="div"
                    variant="body1"
                    color="text.nonselect"
                    sx={{ margin: 'auto 0' }}
                  >
                    {chrome.i18n.getMessage('Selected')}
                  </Typography>
                )}
              </Box>
            </CardActionArea>

            <Divider sx={{ width: '90%', margin: '0 auto' }} />

            <CardActionArea
              sx={{
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                borderRadius: '16px',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
              onClick={() => switchMonitor('source')}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignContent: 'space-between',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  label={chrome.i18n.getMessage('Flow__view__source')}
                  control={
                    <Checkbox
                      size="small"
                      icon={<CircleOutlinedIcon />}
                      checkedIcon={<CheckCircleIcon color="inherit" />}
                      value="flowViewSource"
                      checked={currentMonitor === 'source'}
                      onChange={() => switchMonitor('source')}
                    />
                  }
                />

                {currentMonitor === 'source' && (
                  <Typography
                    component="div"
                    variant="body1"
                    color="text.nonselect"
                    sx={{ margin: 'auto 0' }}
                  >
                    {chrome.i18n.getMessage('Selected')}
                  </Typography>
                )}
              </Box>
            </CardActionArea>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DeveloperMode;
