import { Switch, switchClasses } from '@mui/base/Switch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import {
  Box,
  Typography,
  Checkbox,
  CardActionArea,
  Divider,
  FormControlLabel,
  Fade,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/system';
import React, { useState, useEffect, useCallback } from 'react';

import { storage } from '@/background/webapi';
import { LLHeader } from '@/ui/FRWComponent';
import { useWallet } from 'ui/utils';

const useStyles = makeStyles(() => ({
  arrowback: {
    borderRadius: '100%',
    margin: '8px',
  },
  iconbox: {
    position: 'sticky',
    top: 0,
    // width: '100%',
    backgroundColor: '#121212',
    margin: 0,
    padding: 0,
  },
  developerTitle: {
    zIndex: 20,
    textAlign: 'center',
    top: 0,
    position: 'sticky',
  },
  developerBox: {
    width: 'auto',
    height: 'auto',
    margin: '10px 20px',
    backgroundColor: '#282828',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'row',
    borderRadius: '16px',
    alignContent: 'space-between',
  },

  gasBox: {
    width: '90%',
    margin: '10px auto',
    backgroundColor: '#282828',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'row',
    borderRadius: '16px',
    alignContent: 'space-between',
    gap: '8px',
  },

  radioBox: {
    width: '90%',
    borderRadius: '16px',
    backgroundColor: '#282828',
    margin: '20px auto',
    // padding: '10px 24px',
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'space-between',
    justifyContent: 'space-between',
    padding: '20px 24px',
    alignItems: 'center',
  },
  modeSelection: {
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
    borderRadius: '16px',
    '&:hover': {
      backgroundColor: '#282828',
    },
  },
}));

const orange = {
  500: '#41CC5D',
};

const grey = {
  400: '#BABABA',
  500: '#787878',
  600: '#5E5E5E',
};

const Root = styled('span')(
  ({ theme }) => `
    font-size: 0;
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    // margin: 0;
    margin-left: auto;
    cursor: pointer;

    &.${switchClasses.disabled} {
      opacity: 0.4;
      cursor: not-allowed;
    }

    & .${switchClasses.track} {
      background: ${theme.palette.mode === 'dark' ? grey[600] : grey[400]};
      border-radius: 10px;
      display: block;
      height: 100%;
      width: 100%;
      position: absolute;
    }

    & .${switchClasses.thumb} {
      display: block;
      width: 14px;
      height: 14px;
      top: 3px;
      left: 3px;
      border-radius: 16px;
      background-color: #fff;
      position: relative;
      transition: all 200ms ease;
    }

    &.${switchClasses.focusVisible} .${switchClasses.thumb} {
      background-color: ${grey[500]};
      box-shadow: 0 0 1px 8px rgba(0, 0, 0, 0.25);
    }

    &.${switchClasses.checked} {
      .${switchClasses.thumb} {
        left: 22px;
        top: 3px;
        background-color: #fff;
      }

      .${switchClasses.track} {
        background: ${orange[500]};
      }
    }

    & .${switchClasses.input} {
      cursor: inherit;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      opacity: 0;
      z-index: 1;
      margin: 0;
    }
    `
);

const DeveloperMode = () => {
  const usewallet = useWallet();
  const classes = useStyles();
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
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Developer__Settings')} help={false} />

      <Box className={classes.developerBox}>
        <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
          {chrome.i18n.getMessage('Developer__Mode')}
        </Typography>
        <Switch
          checked={developerModeOn}
          slots={{
            root: Root,
          }}
          onChange={() => {
            switchDeveloperMode();
          }}
        />
      </Box>
      <Fade in={developerModeOn}>
        <Box sx={{ pb: '20px' }}>
          {emulatorFeatureEnabled && (
            <Box className={classes.developerBox}>
              <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
                {chrome.i18n.getMessage('Emulator_Mode')}
              </Typography>
              <Switch
                checked={emulatorModeOn}
                slots={{
                  root: Root,
                }}
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
          <Box className={classes.radioBox}>
            <CardActionArea
              className={classes.modeSelection}
              onClick={() => switchNetwork('mainnet')}
            >
              <Box className={classes.checkboxRow}>
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
              className={classes.modeSelection}
              onClick={() => switchNetwork('testnet')}
            >
              <Box className={classes.checkboxRow}>
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
          <Box className={classes.radioBox}>
            <CardActionArea
              className={classes.modeSelection}
              onClick={() => switchMonitor('flowscan')}
            >
              <Box className={classes.checkboxRow}>
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
              className={classes.modeSelection}
              onClick={() => switchMonitor('source')}
            >
              <Box className={classes.checkboxRow}>
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
      </Fade>
    </div>
  );
};

export default DeveloperMode;
