import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/system';
import { Typography, Avatar, Box, List, ListItemIcon, ListItemButton, ListItemText, IconButton, ListItem, CssBaseline } from '@mui/material';
import theme from '../../../style/LLTheme';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useWallet } from 'ui/utils';

const FetchAvatar = ({ username }) => {
  const [avatar, setAvatar] = useState(`https://lilico.app/api/avatar/beam/120/${username}?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA`);
  const wallet = useWallet();

  const fetchUserAvatar = async (username) => {
    const { data } = await wallet.openapi.searchUser(username)
    const users = data.users
    if (users.length > 0 && users[0].avatar) {
      setAvatar(users[0].avatar)
    }
  }

  useEffect(() => {
    fetchUserAvatar(username)
  }, [])

  return (<Avatar src={avatar}></Avatar>
  )
}


const GoogleAccounts = ({ handleClick, accounts, setUsername }) => {
  const [canGoNext, setCanGoNext] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="registerBox"
      >
        <Typography variant="h4">
          {chrome.i18n.getMessage('We__ve__found') + ' '}
          <Box display="inline" color="primary.main">
            {accounts.length}
            {chrome.i18n.getMessage('matching__accounts')}
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
            {accounts && accounts.map(account => {
              return (
                <ListItem key={account}
                  disablePadding
                >
                  <ListItemButton
                    onClick={() => {
                      setUsername(account)
                      handleClick();
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
                      mb: '12px'
                    }}>
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
              )
            })}
          </List>

        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default GoogleAccounts;
