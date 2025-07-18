import { Box, CardMedia, Divider, Stack, Typography } from '@mui/material';
import { WalletUtils } from '@onflow/fcl';
import React, { useCallback, useEffect, useState } from 'react';

import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from '@onflow/flow-wallet-shared/types/network-types';

// TODO: TB - move all this to the background
// eslint-disable-next-line no-restricted-imports
import {
  authnServiceDefinition,
  serviceDefinition,
} from '@/background/controller/serviceDefinition';
import flowgrey from '@/ui/assets/svg/flow-grey.svg';
import linkGlobe from '@/ui/assets/svg/linkGlobe.svg';
import { LLConnectLoading, LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import CheckCircleIcon from '@/ui/components/iconfont/IconCheckmark';
import { useApproval } from '@/ui/hooks/use-approval';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNetwork } from '@/ui/hooks/useNetworkHook';

import ShowSwitch from './ShowSwitch';

interface ConnectProps {
  params: { tabId: number };
}

const Connect = ({ params: { /*icon, origin,*/ tabId } }: ConnectProps) => {
  const [, resolveApproval, rejectApproval] = useApproval();
  const { network: currentNetwork } = useNetwork();
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
  const [currentAddress, setCurrentAddress] = useState('');
  const [approval, setApproval] = useState(false);

  // TODO: replace default logo
  const [logo, setLogo] = useState('');

  const handleCancel = useCallback(() => {
    if (opener) {
      if (windowId) {
        chrome.windows.update(windowId, { focused: true });
        chrome.tabs.update(opener, { active: true });
      }
      chrome.tabs.sendMessage(opener, {
        f_type: 'PollingResponse',
        f_vsn: '1.0.0',
        status: 'REJECT',
        reason: 'User rejected the request',
        data: {},
      });
    }
    setApproval(false);
    rejectApproval('User rejected the request.');
  }, [opener, rejectApproval, windowId]);

  const handleAllow = async () => {
    setIsLoading(true);
    setApproval(true);
    const address = await wallet.getCurrentAddress();
    const payer = await wallet.getPayerAddressAndKeyId();
    const isEnabled = await wallet.allowLilicoPay();
    const network = await wallet.getNetwork();

    // TODO: FIXME Dynamic keyIndex
    const ki = await wallet.getKeyIndex();
    const keyIndex = Number(ki);
    const services = await authnServiceDefinition(
      address,
      keyIndex,
      payer.address,
      payer.keyId,
      isEnabled,
      network
    );

    let chainId = TESTNET_CHAIN_ID;
    if (network === 'testnet') {
      chainId = TESTNET_CHAIN_ID;
    } else {
      chainId = MAINNET_CHAIN_ID;
    }
    wallet.addConnectedSite(host, title, logo, chainId);

    if (appIdentifier && nonce) {
      const message = WalletUtils.encodeAccountProof({
        appIdentifier, // A human readable string to identify your application during signing
        address, // Flow address of the user authenticating
        nonce, // minimum 32-btye nonce
      });
      const signature = await wallet.signMessage(message);
      const accountProofservice = serviceDefinition(address, keyIndex, 'account-proof', network, {
        f_type: 'account-proof',
        f_vsn: '2.0.0',
        address,
        nonce,
        signatures: [new WalletUtils.CompositeSignature(address!, keyIndex, signature)],
      });
      services.push(accountProofservice);
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
      });

      if (chrome.tabs) {
        if (windowId) {
          chrome.windows.update(windowId, { focused: true });
        }
        // await chrome.tabs.highlight({tabs: tabId})
        await chrome.tabs.update(opener, { active: true });
      }
    }

    resolveApproval();
    chrome.runtime?.onMessage.removeListener(extMessageHandler);
  };

  const extMessageHandler = (msg, sender, sendResponse) => {
    if (msg.type === 'FCL:VIEW:READY:RESPONSE') {
      if (msg.host) {
        setHost(msg.host);
      }
      if (!msg.host) {
        setHost(msg.config.client.hostname);
      }
      setMsgNetwork(msg.config.client.network);
      setAppIdentifier(msg.body?.appIdentifier);
      setNonce(msg.body?.nonce);
      if (msg.config.app.title) setTitle(msg.config.app.title);
      if (msg.config.app.icon) setLogo(msg.config.app.icon);
    }

    sendResponse({ status: 'ok' });
    return true;
  };

  const checkNetwork = useCallback(async () => {
    const address = await wallet.getCurrentAddress();
    setCurrentAddress(address!);

    if (msgNetwork !== currentNetwork && msgNetwork) {
      setShowSwitch(true);
    } else {
      setShowSwitch(false);
    }
  }, [wallet, msgNetwork, currentNetwork]);

  useEffect(() => {
    checkNetwork();
  }, [msgNetwork, currentNetwork, checkNetwork]);

  useEffect(() => {
    /**
     * We can't use "chrome.runtime.sendMessage" for sending messages from React.
     * For sending messages from React we need to specify which tab to send it to.
     */
    if (chrome.tabs) {
      chrome.tabs
        .query({
          active: true,
          currentWindow: false,
        })
        .then((tabs) => {
          /**
           * Sends a single message to the content script(s) in the specified tab,
           * with an optional callback to run when a response is sent back.
           *
           * The runtime.onMessage event is fired in each content script running
           * in the specified tab for the current extension.
           */

          const targetTab = tabs.filter((item) => item.id === tabId);
          let host = '';
          if (targetTab[0].url) {
            host = new URL(targetTab[0].url).host;
          }
          setWindowId(targetTab[0].windowId);
          //  setTabId(tabs[0].index)
          setLogo(targetTab[0].favIconUrl || '');
          setTitle(targetTab[0].title || '');
          setOpener(targetTab[0].id);
          setHost(host);
          chrome.tabs.sendMessage(targetTab[0].id || 0, { type: 'FCL:VIEW:READY' });
        });
    }
    /**
     * Fired when a message is sent from either an extension process or a content script.
     */
    chrome.runtime?.onMessage.addListener(extMessageHandler);

    return () => {
      chrome.runtime?.onMessage.removeListener(extMessageHandler);
    };
  }, [tabId]);

  useEffect(() => {
    const handleWindowRemoved = (wId: number) => {
      if (wId === windowId && !approval) {
        handleCancel();
      }
    };

    chrome.windows.onRemoved.addListener(handleWindowRemoved);

    return () => {
      chrome.windows.onRemoved.removeListener(handleWindowRemoved);
    };
  }, [approval, handleCancel, windowId]);

  const renderContent = () => (
    <Box>
      {isLoading ? (
        <LLConnectLoading logo={logo} />
      ) : (
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
            <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
              <img
                style={{
                  height: '60px',
                  width: '60px',
                  borderRadius: '12px',
                  backgroundColor: 'text.secondary',
                }}
                src={logo}
              />
              <Stack direction="column" spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Typography>{title}</Typography>
                <Typography color="secondary.main" variant="overline">
                  {host}
                </Typography>
              </Stack>
            </Box>
            <Divider />
            <Typography sx={{ textTransform: 'uppercase' }} variant="body1" color="text.secondary">
              {chrome.i18n.getMessage('Connect__Title')}:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '5px' }}>
              <CheckCircleIcon
                size={20}
                color="#38B000"
                style={{ flexShrink: '0', marginTop: '5px' }}
              />
              <Typography>{chrome.i18n.getMessage('Connect__Body1')}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', marginTop: '5px' }}>
              <CheckCircleIcon
                size={20}
                color="#38B000"
                style={{ flexShrink: '0', marginTop: '5px' }}
              />
              <Typography>{chrome.i18n.getMessage('Connect__Body2')}</Typography>
            </Stack>
          </Box>
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
                <Typography sx={{ color: '#FFFFFF66', fontSize: '12px' }}>FLOW Address</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '12px', marginTop: '10px' }}>
                  {currentAddress}
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
                <Typography
                  sx={{
                    color: '#FFFFFFCC',
                    fontSize: '12px',
                    marginTop: '10px',
                    textTransform: 'capitalize',
                  }}
                >
                  {currentNetwork}
                </Typography>
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
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {showSwitch ? (
        <ShowSwitch
          currentNetwork={currentNetwork}
          msgNetwork={msgNetwork}
          onCancel={handleCancel}
        />
      ) : (
        <Box>{renderContent()}</Box>
      )}
    </>
  );
};

export default Connect;
