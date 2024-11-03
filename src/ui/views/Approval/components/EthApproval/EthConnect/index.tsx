import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApproval, useWallet, formatAddress } from 'ui/utils';
import { isValidEthereumAddress } from 'ui/utils/address';
import enableBg from 'ui/FRWAssets/image/enableBg.png';
import { ThemeProvider } from '@mui/system';
import { Stack, Box, Typography, Divider, CardMedia, Card } from '@mui/material';
import linkGlobe from 'ui/FRWAssets/svg/linkGlobe.svg';
import flowgrey from 'ui/FRWAssets/svg/flow-grey.svg';
import CheckCircleIcon from '../../../../../../components/iconfont/IconCheckmark';
import theme from 'ui/style/LLTheme';
// import EthMove from '../EthMove';
import {
  LLPrimaryButton,
  LLSecondaryButton,
  LLSpinner,
  LLConnectLoading
} from 'ui/FRWComponent';

interface ConnectProps {
  params: any;
  // onChainChange(chain: CHAINS_ENUM): void;
  // defaultChain: CHAINS_ENUM;
}

const EthConnect = ({ params: { icon, name, origin } }: ConnectProps) => {
  const { state } = useLocation<{
    showChainsModal?: boolean;
  }>();
  const { showChainsModal = false } = state ?? {};
  const history = useHistory();
  const [, resolveApproval, rejectApproval] = useApproval();
  const { t } = useTranslation();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [appIdentifier, setAppIdentifier] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState<string | undefined>(undefined)
  const [opener, setOpener] = useState<number | undefined>(undefined)
  const [defaultChain, setDefaultChain] = useState('FLOW');
  const [host, setHost] = useState('')
  const [showMoveBoard, setMoveBoard] = useState(true)
  const [msgNetwork, setMsgNetwork] = useState('testnet')
  const [isEvm, setIsEvm] = useState(false)
  const [currentNetwork, setCurrent] = useState('testnet')

  const [approval, setApproval] = useState(false)

  // TODO: replace default logo
  const [logo, setLogo] = useState('')
  const [evmAddress, setEvmAddress] = useState('')
  const init = async () => {

    const network = await wallet.getNetwork();
    setCurrent(network);
    let currentWallet;
    try {
      // Attempt to query the address
      currentWallet = await wallet.getMainWallet();
    } catch (error) {
      // If an error occurs, request approval
      console.error('Error querying EVM address:', error);
    }
    setLogo(icon);
    const res = await wallet.queryEvmAddress(currentWallet);
    setEvmAddress(res!);
    setIsEvm(isValidEthereumAddress(res));
    if (isValidEthereumAddress(res)) {
      const walletInfo = {
        name: 'evm',
        address: res,
        chain_id: currentNetwork,
        coins: ['flow'],
        id: 1
      }
      await wallet.setActiveWallet(walletInfo, 'evm');
    }
    const site = await wallet.getSite(origin);
    const collectList: { name: string; logo_url: string }[] = [];
    const defaultChain = 'FLOW';
    const isShowTestnet = false;

    setDefaultChain(defaultChain);

    setIsLoading(false);
  };

  const createCoa = async () => {
    setIsLoading(true)

    wallet.createCoaEmpty().then(async (createRes) => {
      wallet.listenTransaction(createRes, true, 'Create EVM complete', `Your EVM on Flow address has been created. \nClick to view this transaction.`);

      setIsLoading(false);
    }).catch((err) => {
      console.log(err);
      setIsLoading(false);
    });
  }



  const transactionDoneHanlder = async (request) => {
    if (request.msg === 'transactionDone') {
      const currentWallet = await wallet.getCurrentWallet();
      const res = await wallet.queryEvmAddress(currentWallet.address);
      setEvmAddress(res!);
      setIsEvm(isValidEthereumAddress(res));

    }
    return true
  }

  useEffect(() => {

    chrome.runtime.onMessage.addListener(transactionDoneHanlder);

    return () => {
      chrome.runtime.onMessage.removeListener(transactionDoneHanlder)
    }
  }, []);

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };

  const handleAllow = async () => {
    resolveApproval({
      defaultChain,
      signPermission: 'MAINNET_AND_TESTNET',
    });
  };

  useEffect(() => {
    init();
  }, []);

  const renderContent = () => (
    <Box sx={{ padingTop: '18px' }}>
      {isLoading ?
        <LLConnectLoading logo={logo} />
        :
        <Box sx={{
          margin: '0 18px 0px 18px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          height: '100%',
          background: 'linear-gradient(0deg, #121212, #11271D)'
        }}>
          {isEvm &&
            <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '18px' }}>
              <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
                <CardMedia component="img" sx={{ height: '60px', width: '60px', borderRadius: '12px', backgroundColor: 'text.secondary' }} image={icon} />
                <Stack direction="column" sx={{ justifyContent: 'space-between' }}>
                  <Typography sx={{
                    fontSize: '12px',
                    marginTop: '8px',
                    color: '#FFFFFF66'
                  }}>Connecting to
                  </Typography>
                  <Typography sx={{ fontSize: '18px', marginTop: '8px', fontWeight: '700' }}>{name}</Typography>
                </Stack>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CardMedia component="img" sx={{ width: '16px', height: '16px', marginRight: '8px' }} image={linkGlobe} />
                <Typography color="secondary.main" variant="overline">{origin}</Typography>
              </Box>
              <Divider />
              <Typography sx={{ textTransform: 'uppercase', fontSize: '12px' }} variant="body1" color="text.secondary">{chrome.i18n.getMessage('Connect__Title')}:</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleIcon size={20} color='#38B000' style={{ flexShrink: '0', marginTop: '5px' }} />
                <Typography sx={{ fontSize: '14px' }}>{chrome.i18n.getMessage('Connect__Body1')}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '7px' }}>
                <CheckCircleIcon size={20} color='#38B000' style={{ flexShrink: '0', }} />
                <Typography sx={{ fontSize: '14px' }}>{chrome.i18n.getMessage('Connect__Body2')}</Typography>
              </Stack>
            </Box>
          }

          {isEvm ?

            <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '18px 18px 24px', gap: '8px', width: '100%' }}>

              <Box sx={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#222222', flex: '1' }}>
                <Box sx={{ display: 'flex' }}>
                  <CardMedia component="img" sx={{ height: '18px', width: '18px', borderRadius: '18px', backgroundColor: 'text.secondary', marginRight: '8px' }} image={flowgrey} />
                  <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>EVM on Flow</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '11px' }}>{formatAddress(evmAddress)}</Typography>
                </Box>
              </Box>
              <Box sx={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#222222', flex: '1' }}>
                <Box sx={{ display: 'flex' }}>
                  <CardMedia component="img" sx={{ height: '18px', width: '18px', borderRadius: '18px', marginRight: '8px' }} image={linkGlobe} />
                  <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>{chrome.i18n.getMessage('Network')}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '11px' }}>{currentNetwork}</Typography>
                </Box>
              </Box>
            </Box>
            :


            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', margin: '0 18px', gap: '8px' }}>
              <Typography sx={{ textTransform: 'uppercase', fontSize: '18px' }} variant="body1" color="text.secondary">Evm on FLOW is not enabled</Typography>
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
          }

          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={handleCancel}
            />
            {isEvm ?
              <LLPrimaryButton
                label={chrome.i18n.getMessage('Connect')}
                fullWidth
                type="submit"
                onClick={handleAllow}
              /> :
              <LLPrimaryButton
                label={chrome.i18n.getMessage('Enable')}
                fullWidth
                type="submit"
                onClick={createCoa}
              />

            }
          </Stack>
        </Box>
      }
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
    <ThemeProvider theme={theme}>
      <Box>
        {renderContent()}
      </Box>
    </ThemeProvider>
  );
};

export default EthConnect;
