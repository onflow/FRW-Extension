import { Link } from '@mui/material';
import React from 'react';

import warningIcon from '../assets/svg/lowStorage.svg';

import WarningSnackbar from './WarningSnackbar';

interface WarningNFTNotOnboardedSnackbarProps {
  isNotOnboarded?: boolean;
}

export const WarningNFTNotOnboardedSnackbar = ({
  isNotOnboarded,
}: WarningNFTNotOnboardedSnackbarProps = {}) => {
  if (!isNotOnboarded) {
    return null;
  }

  const message = (
    <>
      {chrome.i18n.getMessage('NFT_Not_onboarded')}{' '}
      <Link
        href="https://port.flow.com"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
          fontWeight: 'bold',
        }}
      >
        Flow Port
      </Link>
    </>
  );

  return (
    <WarningSnackbar
      open={true}
      onClose={() => {}}
      alertIcon={warningIcon}
      message={message}
      sx={{ mt: '8px' }}
    />
  );
};
