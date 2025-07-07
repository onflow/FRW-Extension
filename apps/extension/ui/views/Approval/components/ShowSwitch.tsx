import { Box, Divider, Stack, Typography } from '@mui/material';
import React from 'react';

import Link from '@/ui/assets/svg/link.svg';
import mainnetsvg from '@/ui/assets/svg/mainnet.svg';
import testnetsvg from '@/ui/assets/svg/testnet.svg';
import { LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import { useWallet } from '@/ui/hooks/use-wallet';
import { networkColor } from '@/ui/style/color';

interface ShowSwitchProps {
  currentNetwork: string;
  msgNetwork: string;
  onCancel: () => void;
}

const ShowSwitch: React.FC<ShowSwitchProps> = ({ currentNetwork, msgNetwork, onCancel }) => {
  const wallet = useWallet();

  const handleSwitchNetwork = async () => {
    wallet.switchNetwork(msgNetwork);
  };

  return (
    <Box
      sx={{
        margin: '18px 18px 0px 18px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        height: '506px',
        background: 'linear-gradient(0deg, #121212, #11271D)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '18px' }}>
        <Divider />
        <Typography sx={{ textAlign: 'center', fontSize: '20px', color: '#E6E6E6' }}>
          Allow this site to switch <br />
          the network?
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '18px' }}>
          <Typography sx={{ textAlign: 'center', color: '#BABABA', fontSize: '14px' }}>
            This action will change your current network from{' '}
            <Typography sx={{ display: 'inline', color: '#E6E6E6' }}> {currentNetwork}</Typography>{' '}
            to <Typography sx={{ display: 'inline', color: '#E6E6E6' }}> {msgNetwork}</Typography>.
          </Typography>
        </Stack>
      </Box>
      <Stack
        direction="column"
        spacing="18px"
        sx={{ justifyContent: 'space-between', width: '100%' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              style={{
                height: '60px',
                width: '60px',
                padding: '18px',
                borderRadius: '30px',
                backgroundColor: networkColor(currentNetwork),
                objectFit: 'cover',
              }}
              src={testnetsvg}
            />
            <Typography
              sx={{
                fontSize: '14px',
                color: '#E6E6E6',
                fontWeight: 'bold',
                width: '100%',
                pt: '4px',
                textAlign: 'center',
              }}
            >
              {currentNetwork}
            </Typography>
          </Box>
          <img style={{ width: '116px' }} src={Link} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              style={{
                height: '60px',
                width: '60px',
                padding: '18px',
                borderRadius: '30px',
                backgroundColor: networkColor(msgNetwork),
                objectFit: 'cover',
              }}
              src={mainnetsvg}
            />
            <Typography
              sx={{
                fontSize: '14px',
                color: '#E6E6E6',
                fontWeight: 'bold',
                width: '100%',
                pt: '4px',
                textAlign: 'center',
              }}
            >
              {msgNetwork}
            </Typography>
          </Box>
        </Box>
      </Stack>
      <Box sx={{ flexGrow: 1 }} />
      <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
        <LLSecondaryButton label={chrome.i18n.getMessage('Cancel')} fullWidth onClick={onCancel} />
        <LLPrimaryButton
          label={chrome.i18n.getMessage('Switch__Network')}
          fullWidth
          type="submit"
          onClick={handleSwitchNetwork}
        />
      </Stack>
    </Box>
  );
};

export default ShowSwitch;
