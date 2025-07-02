import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Typography,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Divider,
} from '@mui/material';
import Box from '@mui/material/Box';
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { useWallet } from 'ui/utils';

const Security = () => {
  const navigate = useNavigate();
  const wallet = useWallet();

  useEffect(() => {
    const setTab = async () => {
      await wallet.setDashIndex(3);
    };

    setTab();
  }, [wallet]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          px: '16px',
        }}
      >
        <ArrowBackIcon
          fontSize="medium"
          sx={{ color: 'icon.navi', cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        />
        <Typography
          variant="h1"
          sx={{
            py: '14px',
            alignSelf: 'center',
            fontSize: '20px',
            paddingLeft: '125px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
          }}
        >
          {chrome.i18n.getMessage('Security')}
        </Typography>
      </Box>
      <nav aria-label="secondary part">
        <List sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
          <ListItem component={Link} to="/dashboard/nested/privatekeypassword" disablePadding>
            <ListItemButton>
              <ListItemText primary={chrome.i18n.getMessage('Private__Key')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '25px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
      <Divider />
      <nav aria-label="third part">
        <List sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
          <ListItem component={Link} to="/dashboard/nested/recoveryphrasepassword" disablePadding>
            <ListItemButton>
              <ListItemText primary={chrome.i18n.getMessage('Recovery__Phrase')} />
              <ListItemIcon aria-label="end" sx={{ minWidth: '25px' }}>
                <IconEnd size={12} />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Box>
  );
};

export default Security;
