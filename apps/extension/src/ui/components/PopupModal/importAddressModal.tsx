import {
  Typography,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  Select,
} from '@mui/material';
import React from 'react';

import { CustomDialog } from '../custom-dialog';

const ImportAddressModal = ({ isOpen, onOpenChange, accounts, handleAddressSelection }) => {
  const [selectedAddress, setSelectedAddress] = React.useState(accounts[0]?.address || '');

  const handleChange = (event) => {
    setSelectedAddress(event.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddressSelection(selectedAddress);
  };

  return (
    <CustomDialog open={isOpen} onClose={() => onOpenChange(false)} sx={{ zIndex: 1500 }}>
      <DialogTitle sx={{ color: 'success.main', fontSize: '24px', fontWeight: '700' }}>
        {accounts.length} {chrome.i18n.getMessage('Accounts_Found_on_Chain')}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'hidden' }}>
        <Typography sx={{ color: '#BABABA', margin: '20px 0 20px', fontSize: '16px' }}>
          {chrome.i18n.getMessage('Choose_an_account_you_want_to_import')}
        </Typography>
        <form id="address" onSubmit={handleSubmit}>
          <FormControl fullWidth>
            <Select
              value={selectedAddress}
              onChange={handleChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Select Flow Address' }}
            >
              {accounts.map((account) => (
                <MenuItem key={account.address} value={account.address}>
                  {account.address}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions sx={{ display: 'flex', flexDirection: 'column' }}>
        <Button
          className="registerButton"
          variant="contained"
          color="secondary"
          form="address"
          size="large"
          type="submit"
          sx={{
            height: '56px',
            width: '100%',
            borderRadius: '12px',
            textTransform: 'capitalize',
            gap: '12px',
            display: 'flex',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Import')}
          </Typography>
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          sx={{
            cursor: 'pointer',
            textAlign: 'center',
            backgroundColor: 'transparent',
            height: '56px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            marginTop: '8px',
          }}
        >
          <Typography variant="subtitle1" color="#E6E6E6" sx={{ fontWeight: 'bold' }}>
            {chrome.i18n.getMessage('Maybe_Next_Time')}
          </Typography>
        </Button>
      </DialogActions>
    </CustomDialog>
  );
};

export default ImportAddressModal;
