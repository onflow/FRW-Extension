import { Box, Divider, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from '@/shared/types/network-types';
import Link from '@/ui/assets/svg/link.svg';
import mainnetsvg from '@/ui/assets/svg/mainnet.svg';
import testnetsvg from '@/ui/assets/svg/testnet.svg';
import { LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import { useApproval } from '@/ui/hooks/use-approval';
import { useWallet } from '@/ui/hooks/use-wallet';
import { networkColor } from '@/ui/style/color';

interface ConnectProps {
  params: any;
}

const EthSwitch = ({ params: { origin, target } }: ConnectProps) => {
  const { state } = useLocation();
  const { showChainsModal = false } = state ?? {};
  const navigate = useNavigate();
  const [, resolveApproval, rejectApproval] = useApproval();
  const { t } = useTranslation();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [appIdentifier, setAppIdentifier] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState<string | undefined>(undefined);
  const [opener, setOpener] = useState<number | undefined>(undefined);
  const [windowId, setWindowId] = useState<number | undefined>(undefined);
  const [host, setHost] = useState('');
  const [title, setTitle] = useState('');
  const [msgNetwork, setMsgNetwork] = useState('testnet');
  const [showSwitch, setShowSwitch] = useState(false);
  const [currentNetwork, setCurrent] = useState('testnet');
  const [currentAddress, setCurrentAddress] = useState('');
  const [approval, setApproval] = useState(false);

  // TODO: replace default logo
  const [logo, setLogo] = useState('');

  const handleCancel = () => {
    setApproval(false);
    rejectApproval('User rejected the request.');
  };

  const handleSwitchNetwork = async () => {
    wallet.switchNetwork(target);

    if (currentNetwork !== target) {
      // TODO: replace it with better UX
      setCurrent(target);
      setMsgNetwork(target);
    }
    resolveApproval({
      defaultChain: target === 'testnet' ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID,
      signPermission: 'MAINNET_AND_TESTNET',
    });
  };

  const checkNetwork = useCallback(async () => {
    const network = await wallet.getNetwork();
    setCurrent(network);
    if (target !== network && target) {
      setShowSwitch(true);
    } else {
      setShowSwitch(false);
    }
    const address = await wallet.getCurrentAddress();
    setCurrentAddress(address!);
  }, [wallet, target]);

  useEffect(() => {
    checkNetwork();
  }, [checkNetwork, currentNetwork]);

  return (
    <>
      <Box
        sx={{
          margin: '18px 18px 0px 18px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          height: '100%',
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
              <Typography sx={{ display: 'inline', color: '#E6E6E6' }}>
                {' '}
                {currentNetwork}
              </Typography>{' '}
              to <Typography sx={{ display: 'inline', color: '#E6E6E6' }}> {target}</Typography>.
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
                src={currentNetwork === 'testnet' ? testnetsvg : mainnetsvg}
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
                  backgroundColor: networkColor(target),
                  objectFit: 'cover',
                }}
                src={target === 'testnet' ? testnetsvg : mainnetsvg}
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
                {target}
              </Typography>
            </Box>
          </Box>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
          <LLSecondaryButton
            label={chrome.i18n.getMessage('Cancel')}
            fullWidth
            onClick={handleCancel}
          />
          <LLPrimaryButton
            label={chrome.i18n.getMessage('Switch__Network')}
            fullWidth
            type="submit"
            onClick={handleSwitchNetwork}
          />
        </Stack>
      </Box>
    </>
  );
};

export default EthSwitch;
