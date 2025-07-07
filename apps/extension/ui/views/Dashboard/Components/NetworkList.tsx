import {
  Box,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import React, { useState } from 'react';

import { consoleError } from '@/shared/utils/console-log';
import networkLink from '@/ui/assets/svg/networkLink.svg';
import { useWallet } from '@/ui/hooks/use-wallet';
import { networkColor } from '@/ui/style/color';

const bgColor = (network: string) => {
  return `${networkColor(network)}14`;
};

const NetworkList = ({
  currentNetwork,
  onClose,
}: {
  currentNetwork: string;
  onClose: () => void;
}) => {
  const usewallet = useWallet();

  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const switchNetwork = async (network: string) => {
    setIsSwitchingNetwork(true);
    try {
      if (currentNetwork !== network) {
        // Don't await it, because it will block the main thread
        usewallet.switchNetwork(network);
        onClose();
      }
    } catch (error) {
      consoleError('Error switching network:', error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    switchNetwork(event.target.value);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 16px',
          margin: '0',
          borderRadius: '0',
          flex: '1',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box
            sx={{
              width: '24px',
              minWidth: '16px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
            }}
          >
            <img src={networkLink} alt="networkLink" />
          </Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{ fontSize: '12px' }}
          >
            {chrome.i18n.getMessage('Network')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: '1' }}></Box>
      <FormControl
        sx={{
          minWidth: '100px',
          marginRight: '16px',
        }}
      >
        <Select
          value={currentNetwork}
          onChange={handleChange}
          displayEmpty
          variant="outlined"
          disabled={isSwitchingNetwork}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSwitchingNetwork ? (
                <CircularProgress size={12} />
              ) : (
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: networkColor(selected as string),
                    textTransform: 'capitalize',
                  }}
                >
                  {selected}
                </Typography>
              )}
            </Box>
          )}
          sx={{
            height: '32px',
            borderRadius: '24px',
            backgroundColor: bgColor(currentNetwork),
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '& .MuiSelect-select': {
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: '400',
              color: networkColor(currentNetwork),
              textTransform: 'capitalize',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: '#222222',
                borderRadius: '8px',
                marginTop: '4px',
                zIndex: 2000,
              },
            },
            sx: {
              zIndex: 2000,
            },
          }}
        >
          <MenuItem
            value="mainnet"
            sx={{
              padding: '4px 8px',
              fontSize: '12px',
              lineHeight: '16px',
              fontWeight: '400',
              '&:hover': {
                color: networkColor('mainnet'),
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Mainnet
          </MenuItem>
          <MenuItem
            value="testnet"
            sx={{
              padding: '4px 8px',
              fontSize: '12px',
              lineHeight: '16px',
              fontWeight: '400',
              '&:hover': {
                color: networkColor('testnet'),
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Testnet
          </MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};

export default NetworkList;
