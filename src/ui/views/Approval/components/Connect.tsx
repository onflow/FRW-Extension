import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApproval, useWallet } from 'ui/utils';
// import { CHAINS_ENUM } from 'consts';
import { ThemeProvider } from '@mui/system';
import { Stack, Box, Typography, Divider, CardMedia } from '@mui/material';
import { authnServiceDefinition, serviceDefinition } from 'background/controller/serviceDefinition';
import { permissionService } from 'background/service';
import CheckCircleIcon from '../../../../components/iconfont/IconCheckmark';
import theme from 'ui/style/LLTheme';
import {
  LLPrimaryButton,
  LLSecondaryButton,
  LLConnectLoading
} from 'ui/FRWComponent';
import { WalletUtils } from '@onflow/fcl'
import Link from 'ui/FRWAssets/svg/link.svg';
import testnetsvg from 'ui/FRWAssets/svg/testnet.svg';
import mainnetsvg from 'ui/FRWAssets/svg/mainnet.svg';
import linkGlobe from 'ui/FRWAssets/svg/linkGlobe.svg';
import flowgrey from 'ui/FRWAssets/svg/flow-grey.svg';

import { storage } from '@/background/webapi';

interface ConnectProps {
  params: any;
  // onChainChange(chain: CHAINS_ENUM): void;
  // defaultChain: CHAINS_ENUM;
}

const Connect = ({ params: { icon, origin, tabId } }: ConnectProps) => {
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
  const [windowId, setWindowId] = useState<number | undefined>(undefined)
  const [host, setHost] = useState('')
  const [title, setTitle] = useState('')
  const [msgNetwork, setMsgNetwork] = useState('testnet')
  const [showSwitch, setShowSwitch] = useState(false)
  const [currentNetwork, setCurrent] = useState('testnet')
  const [currentAddress, setCurrentAddress] = useState('')
  const [approval, setApproval] = useState(false)

  // TODO: replace default logo
  const [logo, setLogo] = useState('')

  const handleCancel = () => {
    if (opener) {
      if (windowId) {
        chrome.windows.update(windowId, { focused: true })
        chrome.tabs.update(opener, { active: true })
      }
      chrome.tabs.sendMessage(opener, {
        f_type: 'PollingResponse',
        f_vsn: '1.0.0',
        status: 'REJECT',
        reason: 'User rejected the request',
        data: {},
      })
    }
    setApproval(false);
    rejectApproval('User rejected the request.');
  };

  const handleSwitchNetwork = async () => {
    wallet.switchNetwork(msgNetwork);

    if (currentNetwork !== msgNetwork) {
      // TODO: replace it with better UX
      setCurrent(msgNetwork);
      setMsgNetwork(msgNetwork);
    }
  }

  const handleAllow = async () => {
    setIsLoading(true);
    setApproval(true);
    const address = await wallet.getCurrentAddress();
    const payer = await wallet.getPayerAddressAndKeyId();
    const isEnabled = await wallet.allowLilicoPay();
    const network = await wallet.getNetwork();

    // TODO: FIXME Dynamic keyIndex
    const ki = await storage.get('keyIndex');
    const keyIndex = Number(ki);
    const services = await authnServiceDefinition(address, keyIndex, payer.address, payer.keyId, isEnabled, network)

    
    let chainId = 545;
    if (network === 'testnet') {
      chainId = 545;
    } else {
      chainId = 747;
    }
    console.log('permission add ', host, title, logo, chainId)
    permissionService.addConnectedSite(host, title, logo, chainId);

    if (appIdentifier && nonce) {
      const message = WalletUtils.encodeAccountProof({
        appIdentifier, // A human readable string to identify your application during signing
        address,       // Flow address of the user authenticating
        nonce,         // minimum 32-btye nonce
      })
      const signature = await wallet.signMessage(message)
      const accountProofservice = serviceDefinition(address, keyIndex, 'account-proof', network,
        {
          f_type: 'account-proof',
          f_vsn: '2.0.0',
          address,
          nonce,
          signatures: [
            new WalletUtils.CompositeSignature(
              address,
              keyIndex,
              signature
            ),
          ]
        }
      )
      services.push(accountProofservice)
    }

    if (opener) {
      chrome.tabs.sendMessage(opener, {
        f_type: 'PollingResponse',
        f_vsn: '1.0.0',
        status: 'APPROVED',
        reason: null,
        data: {
          f_type: 'AuthnResponse',
          f_vsn: '1.0.0',
          network: network,
          addr: address,
          services: services,
        },
      })

      if (chrome.tabs) {
        if (windowId) {
          chrome.windows.update(windowId, { focused: true })
        }
        // await chrome.tabs.highlight({tabs: tabId})
        await chrome.tabs.update(opener, { active: true });
      }
    }

    resolveApproval();
    chrome.runtime?.onMessage.removeListener(extMessageHandler);
  };

  const extMessageHandler = (msg, sender, sendResponse) => {
    // if (msg.config.client.network !== network) {
    //   console.log('not in correct network')
    // }
    if (msg.type === 'FCL:VIEW:READY:RESPONSE') {
      console.log('FCL:VIEW:READY:RESPONSE ', msg)
      msg.host && setHost(msg.host)
      if (!msg.host) {
        setHost(msg.config.client.hostname)
      }
      setMsgNetwork(msg.config.client.network);
      setAppIdentifier(msg.body?.appIdentifier)
      setNonce(msg.body?.nonce)
      msg.config.app.title && setTitle(msg.config.app.title)
      msg.config.app.icon && setLogo(msg.config.app.icon)
    }


    sendResponse({ status: 'ok' });
    return true
  }

  const checkNetwork = async () => {
    const address = await wallet.getCurrentAddress();
    console.log('address currentAddress ', address)
    setCurrentAddress(address!);

    const network = await wallet.getNetwork();

    console.log(' msgNetwork ', msgNetwork, network, showSwitch)
    setCurrent(network);
    if (msgNetwork !== network && msgNetwork) {
      setShowSwitch(true);
    } else {
      setShowSwitch(false);
    }
  }


  useEffect(() => {
    checkNetwork();

  }, [msgNetwork, currentNetwork])

  useEffect(() => {
    /**
     * We can't use "chrome.runtime.sendMessage" for sending messages from React.
     * For sending messages from React we need to specify which tab to send it to.
     */
    chrome.tabs &&
      chrome.tabs.query(
        {
          active: true,
          currentWindow: false,
        }
      ).then((tabs) => {
        /**
           * Sends a single message to the content script(s) in the specified tab,
           * with an optional callback to run when a response is sent back.
           *
           * The runtime.onMessage event is fired in each content script running
           * in the specified tab for the current extension.
           */

        const targetTab = tabs.filter(item => item.id == tabId)
        let host = ''
        if (targetTab[0].url) {
          host = new URL(targetTab[0].url).host
        }
        setWindowId(targetTab[0].windowId)
        //  setTabId(tabs[0].index)
        setLogo(targetTab[0].favIconUrl || '')
        setTitle(targetTab[0].title || '')
        setOpener(targetTab[0].id)
        setHost(host)
        chrome.tabs.sendMessage(targetTab[0].id || 0, { type: 'FCL:VIEW:READY' })
      })

    /**
     * Fired when a message is sent from either an extension process or a content script.
     */
    chrome.runtime?.onMessage.addListener(extMessageHandler)

    return () => {
      chrome.runtime?.onMessage.removeListener(extMessageHandler);
    }

  }, [])

  window.onbeforeunload = () => {
    if (!approval) {
      handleCancel()
    }
  }

  const networkColor = (network: string) => {
    switch (network) {
      case 'mainnet':
        return '#41CC5D';
      case 'testnet':
        return '#FF8A00';
      case 'crescendo':
        return '#CCAF21';
    }
  };

  const renderContent = () => (
    <Box>
      {isLoading ? <LLConnectLoading logo={logo} /> :
        (<Box sx={{
          margin: '18px 18px 0px 18px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          height: '100%',
          background: 'linear-gradient(0deg, #121212, #11271D)'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '18px' }}>
            <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
              <img style={{ height: '60px', width: '60px', borderRadius: '12px', backgroundColor: 'text.secondary' }} src={logo} />
              <Stack direction="column" spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Typography>{title}</Typography>
                <Typography color="secondary.main" variant="overline">{host}</Typography>
              </Stack>
            </Box>
            <Divider />
            <Typography sx={{ textTransform: 'uppercase' }} variant="body1" color="text.secondary">{chrome.i18n.getMessage('Connect__Title')}:</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '5px' }}>
              <CheckCircleIcon size={20} color='#38B000' style={{ flexShrink: '0', marginTop: '5px' }} />
              <Typography>{chrome.i18n.getMessage('Connect__Body1')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '5px' }}>
              <CheckCircleIcon size={20} color='#38B000' style={{ flexShrink: '0', marginTop: '5px' }} />
              <Typography>{chrome.i18n.getMessage('Connect__Body2')}</Typography>
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '18px 18px 24px', gap: '8px', width: '100%' }}>

            <Box sx={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#222222', flex: '1' }}>
              <Box sx={{ display: 'flex' }}>
                <CardMedia component="img" sx={{ height: '18px', width: '18px', borderRadius: '18px', backgroundColor: 'text.secondary', marginRight: '8px' }} image={flowgrey} />
                <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>FLOW Address</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '10px' }}>{currentAddress}</Typography>
              </Box>
            </Box>
            <Box sx={{ borderRadius: '8px', padding: '12px 16px', backgroundColor: '#222222', flex: '1' }}>
              <Box sx={{ display: 'flex' }}>
                <CardMedia component="img" sx={{ height: '18px', width: '18px', borderRadius: '18px', marginRight: '8px' }} image={linkGlobe} />
                <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>{chrome.i18n.getMessage('Network')}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '10px', textTransform: 'capitalize' }}>{currentNetwork}</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={handleCancel}
            />
            <LLPrimaryButton
              label={chrome.i18n.getMessage('Connect')}
              fullWidth
              type="submit"
              onClick={handleAllow}
            />
          </Stack>
        </Box>)}
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      {showSwitch ?
        <Box sx={{
          margin: '18px 18px 0px 18px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          height: '506px',
          background: 'linear-gradient(0deg, #121212, #11271D)'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '18px' }}>
            <Divider />
            <Typography sx={{ textAlign: 'center', fontSize: '20px', color: '#E6E6E6' }} >Allow this site to switch  <br />the network?</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '18px' }}>
              <Typography sx={{ textAlign: 'center', color: '#BABABA', fontSize: '14px' }}>This action will change your current network from <Typography sx={{ display: 'inline', color: '#E6E6E6' }}  > {currentNetwork}</Typography> to <Typography sx={{ display: 'inline', color: '#E6E6E6' }} > {msgNetwork}</Typography>.</Typography>
            </Stack>
          </Box>
          <Stack direction="column" spacing="18px" sx={{ justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', justifyContent: 'center', alignItems: 'stretch' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img style={{ height: '60px', width: '60px', padding: '18px', borderRadius: '30px', backgroundColor: networkColor(currentNetwork), objectFit: 'cover' }} src={testnetsvg} />
                <Typography sx={{ fontSize: '14px', color: '#E6E6E6', fontWeight: 'bold', width: '100%', pt: '4px', textAlign: 'center' }}>{currentNetwork}</Typography>
              </Box>
              <img style={{ width: '116px' }} src={Link} />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img style={{ height: '60px', width: '60px', padding: '18px', borderRadius: '30px', backgroundColor: networkColor(msgNetwork), objectFit: 'cover' }} src={mainnetsvg} />
                <Typography sx={{ fontSize: '14px', color: '#E6E6E6', fontWeight: 'bold', width: '100%', pt: '4px', textAlign: 'center' }}>{msgNetwork}</Typography>
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
        :
        <Box>
          {renderContent()}
        </Box>

      }
    </ThemeProvider>
  );
};

export default Connect;
