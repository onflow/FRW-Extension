import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import IconCreate from '@/ui/components/iconfont/IconCreate';

const TokenDropdown = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  // Open the dropdown menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close the dropdown menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Navigate to Token List
  const goToTokenList = () => {
    navigate('/dashboard/tokenList');
    handleMenuClose();
  };

  // Navigate to Token List
  const goToCustom = () => {
    navigate('/dashboard/tokenList');
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', px: '12px', pt: '4px' }}>
      <Box sx={{ flexGrow: 1 }} />
      <IconButton onClick={handleMenuOpen}>
        <IconCreate size={16} color="#787878" />
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: '#333333',
            padding: '8px', // Outer padding
            color: '#FFFFFF',
          },
        }}
      >
        <MenuItem
          onClick={goToTokenList}
          sx={{
            padding: '0',
            '& .MuiListItem-root': {
              padding: '0',
            },
          }}
        >
          Add Token
        </MenuItem>

        <MenuItem
          onClick={goToCustom}
          sx={{
            padding: '0',
            '& .MuiListItem-root': {
              padding: '0',
            },
          }}
        >
          Add Custom Token
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TokenDropdown;
