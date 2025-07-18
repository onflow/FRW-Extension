import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { useWallet } from '@/ui/hooks/use-wallet';

const FetchAvatar = ({ username }) => {
  const [avatar, setAvatar] = useState(
    `https://lilico.app/api/avatar/beam/120/${username}?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA`
  );
  const usewallet = useWallet();

  const fetchUserAvatar = useCallback(
    async (username) => {
      const { data } = await usewallet.openapi.searchUser(username);
      const users = data.users;
      if (users.length > 0 && users[0].avatar) {
        setAvatar(users[0].avatar);
      }
    },
    [setAvatar, usewallet.openapi]
  );

  useEffect(() => {
    fetchUserAvatar(username);
  }, [fetchUserAvatar, username]);

  return <Avatar src={avatar} sx={{ width: '40px', height: '40px', borderRadius: '8px' }} />;
};

const GoogleAccounts = ({ handleSwitchTab, accounts, setUsername }) => {
  return (
    <>
      <Box className="registerBox">
        <Typography variant="h4">
          {chrome.i18n.getMessage('We__ve__found') + ' '}
          <Box display="inline" color="primary.main">
            {accounts.length} {chrome.i18n.getMessage('matching__accounts')}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Select__the__account__which__you__want__to__restore__back')}
        </Typography>

        <Box
          sx={{
            borderRadius: '12px',
            my: '32px',
            position: 'relative',
            overflow: 'scroll',
            height: '270px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <List component="nav" aria-label="secondary mailbox folder">
            {accounts &&
              accounts.map((account) => {
                return (
                  <ListItem key={account} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setUsername(account);
                        handleSwitchTab();
                      }}
                      sx={{
                        display: 'flex',
                        border: '2px solid #5E5E5E',
                        width: '100%',
                        borderRadius: '12px',
                        backgroundColor: '#333333',
                        transition: 'all .3s linear',
                        py: '8px',
                        px: '16px',
                        justifyContent: 'center',
                        mb: '12px',
                      }}
                    >
                      <ListItemIcon>
                        <FetchAvatar username={account} />
                      </ListItemIcon>
                      <ListItemText primary={account} />
                      <Box sx={{ flexGrow: 1 }} />
                      <IconButton edge="end" aria-label="comments">
                        <ArrowForwardRoundedIcon color="primary" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </List>
        </Box>
      </Box>
    </>
  );
};

export default GoogleAccounts;
