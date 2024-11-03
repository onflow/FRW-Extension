import React, { useState, useEffect, useRef } from 'react';
import { Box, ListItemButton, Typography, ListItem, ListItemIcon, CardMedia } from '@mui/material';
import { useWallet } from 'ui/utils';
import mainnetIndicator from '../../../FRWAssets/svg/mainnetArrow.svg';
import testnetIndicator from '../../../FRWAssets/svg/testnetArrow.svg';
import networkLink from '../../../FRWAssets/svg/networkLink.svg';
import { useHistory } from 'react-router-dom';


const NetworkList = ({ networkColor, currentNetwork }) => {


  const usewallet = useWallet();

  const history = useHistory();
  const [showDropdown, setShowDropdown] = useState(false);

  const [indicatorRotation, setIndicatorRotation] = useState(180); // Initial rotation angle

  const dropdownRef = useRef<HTMLLIElement>(null);


  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    // Add event listener for clicks
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);


  const rotateIndicator = () => {
    setIndicatorRotation(indicatorRotation === 180 ? 0 : 180); // Toggle rotation angle
  };

  const switchNetwork = async (network: string) => {
    // if (network === 'crescendo' && !isSandboxEnabled) {
    //   return;
    // }

    usewallet.switchNetwork(network);

    if (currentNetwork !== network) {
      // TODO: replace it with better UX
      history.push('/dashboard')
      window.location.reload();
    }
  };

  const getIndicatorImage = () => {
    switch (currentNetwork) {
      case 'mainnet':
        return mainnetIndicator;
      case 'testnet':
        return testnetIndicator;
      default:
        return mainnetIndicator; // Default to mainnet if no match
    }
  };


  const bgColor = (network: string) => {
    switch (network) {
      case 'mainnet':
        return '#41CC5D14';
      case 'testnet':
        return '#FF8A0014';
      case 'crescendo':
        return '#CCAF2114';
    }
  };
  return (
    <ListItem
      disablePadding
      sx={{ display: 'flex', justifyContent: 'space-between' }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 16px',
          margin: '0',
          borderRadius: '0',
          flex: '1'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <ListItemIcon
            sx={{
              width: '24px',
              minWidth: '16px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}
          >
            <CardMedia component="img" sx={{ width: '16px', height: '16px' }} image={networkLink} />
          </ListItemIcon>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '12px' }}
          >
            {chrome.i18n.getMessage('Network')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: '1' }}></Box>
      <ListItemButton
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '24px',
          cursor: 'pointer',
          height: '24px',
          maxWidth: 'auto',
          backgroundColor: bgColor(currentNetwork),
          marginRight: '16px'
        }}
        onClick={() => {
          rotateIndicator();
          toggleDropdown();
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
            marginRight: '12px',
            lineHeight: '24px',
            fontWeight: '400',
            color: networkColor(currentNetwork),
            textTransform: 'capitalize'
          }}
        >
          {currentNetwork}
        </Typography>
        <CardMedia
          component="img"
          sx={{
            width: '16px',
            height: '16px',
            transform: `rotate(${indicatorRotation}deg)`
          }}
          image={getIndicatorImage()}
        />
        {showDropdown &&
          <ListItem
            ref={dropdownRef}
            disablePadding
            sx={{
              position: 'absolute', width: 'auto', height: 'auto', display: 'flex', top: '28px', py: '4px', flexDirection: 'column', alignItems: 'flex-start', zIndex: '2000', textAlign: 'left',
              left: '0',
              backgroundColor: '#222222', borderRadius: '8px'
            }}>

            <ListItemButton
              onClick={() => switchNetwork('mainnet')}
              sx={{
                padding: '4px 8px',
                width: '100%',
                '&:hover': {
                  color: networkColor('mainnet')
                }
              }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: '400',
                  textAlign: 'left',
                  '&:hover': {
                    color: networkColor('mainnet')
                  }
                }}
              >
                Mainnet
              </Typography>
            </ListItemButton>

            <ListItemButton
              onClick={() => switchNetwork('testnet')}
              sx={{
                padding: '4px 8px',
                width: '100%',
                '&:hover': {
                  color: networkColor('testnet')
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: '400',
                  '&:hover': {
                    color: networkColor('testnet')
                  }
                }}
              >
                Testnet
              </Typography>
            </ListItemButton>
          </ListItem>
        }

      </ListItemButton >
    </ListItem >
  );
};

export default NetworkList;
