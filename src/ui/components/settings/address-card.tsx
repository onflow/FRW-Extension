import { Box, Typography, IconButton, List, ListItem, ListItemButton } from '@mui/material';
import React from 'react';

import { CopyIcon } from '@/ui/assets/icons/CopyIcon';

interface AddressCardProps {
  address: string;
  label?: string;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, label = 'Address' }) => (
  <List
    sx={{
      borderRadius: '16px',
      overflow: 'hidden',
      backgroundColor: '#282828',
      margin: '8px auto 8px auto',
      pt: 0,
      pb: 0,
      width: '100%',
      padding: '0 2px',
    }}
  >
    <ListItem
      disablePadding
      sx={{
        height: '66px',
        width: '100%',
        '&:hover': {
          backgroundColor: '#282828',
        },
      }}
    >
      <ListItemButton
        sx={{
          height: '100%',
          margin: '0 auto',
          '&:hover': {
            backgroundColor: '#282828',
          },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography
            sx={{
              color: '#bababa',
              fontSize: '12px',
              fontWeight: 400,
              marginBottom: '2px',
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontSize: '16px',
              fontWeight: 500,
              flex: 1,
              wordBreak: 'break-all',
            }}
          >
            {address}
          </Typography>
        </Box>
        <IconButton
          onClick={() => {
            if (address) {
              navigator.clipboard.writeText(address);
            }
          }}
          sx={{ color: '#bababa', ml: 1 }}
        >
          <CopyIcon width={20} height={20} />
        </IconButton>
      </ListItemButton>
    </ListItem>
  </List>
);

export default AddressCard;
