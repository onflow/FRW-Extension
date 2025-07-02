import {
  Typography,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Box,
} from '@mui/material';
import React from 'react';
import { Link } from 'react-router';

import { LLHeader } from '@/ui/components';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import EmptyStateImage from 'ui/assets/image/search_user.png';

const Linked = () => {
  const { childAccounts } = useProfiles();

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Linked_Account')} help={false} />
      {childAccounts && childAccounts.length > 0 && (
        <Typography
          variant="body1"
          component="span"
          color="#787878"
          textAlign="left"
          fontSize={'14px'}
          sx={{ padding: '0 18px' }}
          // color={key === currentWallet ? 'text.nonselect' : 'text.primary'}
        >
          {chrome.i18n.getMessage('Linked_Account')}
        </Typography>
      )}
      {childAccounts && childAccounts.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            padding: '18px',
            alignItems: 'center',
          }}
        >
          {childAccounts.map((childAccount) => (
            <ListItem
              key={childAccount.address}
              disablePadding
              sx={{ mb: 0, backgroundColor: '#292929', borderRadius: '16px', marginBottom: '8px' }}
              component={Link}
              to={`/dashboard/setting/linkeddetail/${childAccount.address}`}
            >
              <ListItemButton sx={{ mb: 0, padding: '12px 20px', borderRadius: '16px' }}>
                <ListItemIcon>
                  <img
                    style={{
                      borderRadius: '18px',
                      marginRight: '12px',
                      height: '36px',
                      width: '36px',
                      objectFit: 'cover',
                    }}
                    src={childAccount?.icon ?? 'https://lilico.app/placeholder-2.0.png'}
                    alt={childAccount?.name ?? childAccount.address}
                  />
                </ListItemIcon>
                <ListItemText
                  sx={{ display: 'flex', flexDirection: 'column' }}
                  primary={
                    <Typography
                      variant="body1"
                      component="span"
                      color="#fff"
                      fontSize={'14px'}
                      // color={key === currentWallet ? 'text.nonselect' : 'text.primary'}
                    >
                      {childAccount?.name ?? childAccount.address}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body1"
                      component="span"
                      color="#808080"
                      fontSize={'12px'}
                      // color={key === currentWallet ? 'text.nonselect' : 'text.primary'}
                    >
                      {childAccount.address}
                    </Typography>
                  }
                />
                <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                  <IconEnd size={12} />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '80%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={EmptyStateImage}
            style={{
              objectFit: 'none',
            }}
          />
          <Typography variant="body1" color="text.secondary">
            {chrome.i18n.getMessage('No_linked')}
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default Linked;
