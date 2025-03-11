import { Stack, Box, Typography, Divider, CardMedia } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { isValidEthereumAddress } from '@/shared/utils/address';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import flowgrey from 'ui/FRWAssets/svg/flow-grey.svg';
import linkGlobe from 'ui/FRWAssets/svg/linkGlobe.svg';
import { LLPrimaryButton, LLSecondaryButton, LLConnectLoading } from 'ui/FRWComponent';
import { useApproval, useWallet, formatAddress } from 'ui/utils';

import CheckCircleIcon from '../../../../../../components/iconfont/IconCheckmark';
import IconWithPlaceholder from '../EthApprovalComponents/IconWithPlaceholder';

// import EthMove from '../EthMove';

interface ConnectProps {
  params: any;
}

// The EthConnect component is used to connect to the dApp
// The EthConnect component will show the user the request and allow or reject it

// It is triggered by the eth_requestAccounts method
// If the dApp has never connected to the wallet before, it will ask the user for permission to connect
// If the dApp has connected to the wallet before, it will simply connect to the wallet
// This ensures the wallet is logged in and ready to use with the dApp

// Note that SortHat is the first page that is loaded when the approval notification is opened by the background
// SortHat ensures the wallet is logged in and ready to use with the dApp

// The Approval page is loaded if SortHat detects that the wallet is already logged in and the background has a pending approval
// The Approval page looks at the approvalComponent in the background approval object
// The Approval page then renders the corresponding component based on the approvalComponent

// In this case, the approvalComponent is 'EthConnect'

const EthConnect = ({ params: { icon, name, origin } }: ConnectProps) => {
  // This is used to resolve or reject the approval in the background
  const [, resolveApproval, rejectApproval] = useApproval();
  // This is used to interact with the wallet
  const usewallet = useWallet();

  // This is used to show a loading spinner
  const [isLoading, setIsLoading] = useState(false);

  const [defaultChain, setDefaultChain] = useState(747);
  const [isEvm, setIsEvm] = useState(false);
  const [currentNetwork, setCurrent] = useState('testnet');

  // TODO: replace default logo
  const [logo, setLogo] = useState('');
  const [evmAddress, setEvmAddress] = useState('');

  // This is used to initialize the component when the page is loaded

  const init = useCallback(async () => {
    const network = await usewallet.getNetwork();
    setCurrent(network);
    let currentWallet;
    try {
      // Attempt to query the address
      currentWallet = await usewallet.getMainWallet();
    } catch (error) {
      // If an error occurs, request approval
      console.error('Error querying EVM address:', error);
    }
    setLogo(icon);
    const res = await usewallet.queryEvmAddress(currentWallet);
    setEvmAddress(res!);
    setIsEvm(isValidEthereumAddress(res));
    if (isValidEthereumAddress(res)) {
      const walletInfo = {
        name: 'evm',
        address: res,
        chain_id: currentNetwork,
        coins: ['flow'],
        id: 1,
        icon: icon,
        color: '#282828',
      };
      await usewallet.setActiveWallet(walletInfo, 'evm');
    }
    const defaultChain = network === 'testnet' ? 545 : 747;

    setDefaultChain(defaultChain);

    setIsLoading(false);
  }, [usewallet, icon, currentNetwork]);

  const createCoa = async () => {
    setIsLoading(true);

    usewallet
      .createCoaEmpty()
      .then(async (createRes) => {
        usewallet.listenTransaction(
          createRes,
          true,
          'Create EVM complete',
          `Your EVM on Flow address has been created. \nClick to view this transaction.`
        );

        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  };

  const transactionDoneHandler = useCallback(
    async (request) => {
      if (request.msg === 'transactionDone') {
        const currentWallet = await usewallet.getCurrentWallet();
        if (!currentWallet) {
          throw new Error('Current wallet is undefined');
        }
        const res = await usewallet.queryEvmAddress(currentWallet.address);
        setEvmAddress(res!);
        setIsEvm(isValidEthereumAddress(res));
      }
      return true;
    },
    [usewallet]
  );

  useEffect(() => {
    // Handle listenting for transactionDone event
    chrome.runtime.onMessage.addListener(transactionDoneHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(transactionDoneHandler);
    };
  }, [transactionDoneHandler]);

  const handleCancel = () => {
    // This is called when the user clicks the cancel button
    // This cancels the connection to the dApp
    rejectApproval('User rejected the request.');
  };

  const handleAllow = async () => {
    // This is called when the user clicks the allow button
    // This allows the connection to the dApp
    resolveApproval({
      defaultChain,
      signPermission: 'MAINNET_AND_TESTNET',
    });
  };

  useEffect(() => {
    init();
  }, [init]);

  const renderContent = () => (
    <Box sx={{ padingTop: '18px' }}>
      {isLoading ? (
        <LLConnectLoading logo={logo} />
      ) : (
        <Box
          sx={{
            margin: '0 18px 0px 18px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            height: '100%',
            background: 'linear-gradient(0deg, #121212, #11271D)',
          }}
        >
          {isEvm && (
            <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '18px' }}>
              <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
                <IconWithPlaceholder imageUrl={icon} />
                <Stack direction="column" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      marginTop: '8px',
                      color: '#FFFFFF66',
                    }}
                  >
                    Connecting to
                  </Typography>
                  <Typography sx={{ fontSize: '18px', marginTop: '8px', fontWeight: '700' }}>
                    {name}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  sx={{ width: '16px', height: '16px', marginRight: '8px' }}
                  image={linkGlobe}
                />
                <Typography color="secondary.main" variant="overline">
                  {origin}
                </Typography>
              </Box>
              <Divider />
              <Typography
                sx={{ textTransform: 'uppercase', fontSize: '12px' }}
                variant="body1"
                color="text.secondary"
              >
                {chrome.i18n.getMessage('Connect__Title')}:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleIcon
                  size={20}
                  color="#38B000"
                  style={{ flexShrink: '0', marginTop: '5px' }}
                />
                <Typography sx={{ fontSize: '14px' }}>
                  {chrome.i18n.getMessage('Connect__Body1')}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'flex-start', marginTop: '7px' }}
              >
                <CheckCircleIcon size={20} color="#38B000" style={{ flexShrink: '0' }} />
                <Typography sx={{ fontSize: '14px' }}>
                  {chrome.i18n.getMessage('Connect__Body2')}
                </Typography>
              </Stack>
            </Box>
          )}

          {isEvm ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '18px 18px 24px',
                gap: '8px',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  borderRadius: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#222222',
                  flex: '1',
                }}
              >
                <Box sx={{ display: 'flex' }}>
                  <CardMedia
                    component="img"
                    sx={{
                      height: '18px',
                      width: '18px',
                      borderRadius: '18px',
                      backgroundColor: 'text.secondary',
                      marginRight: '8px',
                    }}
                    image={flowgrey}
                  />
                  <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>EVM on Flow</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '11px' }}>
                    {formatAddress(evmAddress)}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  borderRadius: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#222222',
                  flex: '1',
                }}
              >
                <Box sx={{ display: 'flex' }}>
                  <CardMedia
                    component="img"
                    sx={{ height: '18px', width: '18px', borderRadius: '18px', marginRight: '8px' }}
                    image={linkGlobe}
                  />
                  <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>
                    {chrome.i18n.getMessage('Network')}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '11px' }}>
                    {currentNetwork}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                margin: '0 18px',
                gap: '8px',
              }}
            >
              <Typography
                sx={{ textTransform: 'uppercase', fontSize: '18px' }}
                variant="body1"
                color="text.secondary"
              >
                Evm on FLOW is not enabled
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  textAlign: 'Montserrat',
                  fontFamily: 'Inter',
                  fontSize: '12px',
                }}
                color="error"
              >
                {chrome.i18n.getMessage('enable_the_path_to_evm_on_flow')}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'normal', color: '#bababa', textAlign: 'left', fontSize: '12px' }}
                color="error"
              >
                {chrome.i18n.getMessage('manage_multi_assets_seamlessly')}
              </Typography>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={handleCancel}
            />
            {isEvm ? (
              <LLPrimaryButton
                label={chrome.i18n.getMessage('Connect')}
                fullWidth
                type="submit"
                onClick={handleAllow}
              />
            ) : (
              <LLPrimaryButton
                label={chrome.i18n.getMessage('Enable')}
                fullWidth
                type="submit"
                onClick={createCoa}
              />
            )}
          </Stack>
        </Box>
      )}
      {/* {
        showMoveBoard && (
          <EthMove
            showMoveBoard={showMoveBoard}
            handleCloseIconClicked={() => setMoveBoard(false)}
            handleCancelBtnClicked={() => setMoveBoard(false)}
            handleAddBtnClicked={() => {
              setMoveBoard(false);
            }}
          />
        )
      } */}
    </Box>
  );

  return (
    <>
      <Box>{renderContent()}</Box>
    </>
  );
};

export default EthConnect;
