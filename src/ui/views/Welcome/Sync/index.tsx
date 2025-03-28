import { Box } from '@mui/material';
import { Core } from '@walletconnect/core';
import SignClient from '@walletconnect/sign-client';
import { type SessionTypes } from '@walletconnect/types';
import * as bip39 from 'bip39';
import HDWallet from 'ethereum-hdwallet';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { FCLWalletConnectMethod } from '@/shared/utils/type';
import AllSet from '@/ui/FRWComponent/LandingPages/AllSet';
import LandingComponents from '@/ui/FRWComponent/LandingPages/LandingComponents';
import SetPassword from '@/ui/FRWComponent/LandingPages/SetPassword';
import { useWallet } from 'ui/utils';

import SyncQr from './SyncQr';

const STEPS = {
  QR: 'qr',
  PASSWORD: 'password',
  ALL_SET: 'all_set',
} as const;

type StepType = (typeof STEPS)[keyof typeof STEPS];

interface DeviceInfoRequest {
  deviceId: string;
  ip: string;
  name: string;
  type: string;
  userAgent: string;

  continent?: string;
  continentCode?: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  city?: string;
  district?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  currency?: string;
  isp?: string;
  org?: string;
  device_id?: string;
}

const Sync = () => {
  const history = useHistory();
  const usewallet = useWallet();
  const [activeTab, setActiveTab] = useState<StepType>(STEPS.QR);
  const [username, setUsername] = useState('');
  const [mnemonic, setMnemonic] = useState(bip39.generateMnemonic());
  const [accountKey, setAccountKey] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [uri, setUri] = useState('');
  const [loadingString, setLoadingString] = useState<string | null>(null);
  const [secondLine, setSecondLine] = useState<string>('');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState<boolean>(true);
  const [isAddWallet, setIsAddWallet] = useState<boolean>(false);

  useEffect(() => {
    const checkWalletStatus = async () => {
      const isBooted = await usewallet.isBooted();
      setIsAddWallet(isBooted);
    };

    checkWalletStatus();
  }, [usewallet]);

  // Check if user is already logged in and redirect if necessary
  const loadView = useCallback(async () => {
    usewallet
      .getCurrentAccount()
      .then((res) => {
        if (res) {
          history.push('/');
        }
      })
      .catch(() => {
        return;
      });
  }, [usewallet, history]);

  useEffect(() => {
    loadView();
  }, [loadView]);

  // 1. Initial Setup Functions - These are created once when component mounts
  const getAccountKey = useCallback(() => {
    const hdwallet = HDWallet.fromMnemonic(mnemonic);
    const publicKey = hdwallet.derive("m/44'/539'/0'/0/0").getPublicKey().toString('hex');

    return {
      hashAlgo: 1,
      signAlgo: 2,
      weight: 1000,
      publicKey,
    };
  }, [mnemonic]);

  const getDeviceInfo = useCallback(async (): Promise<DeviceInfoRequest> => {
    const [locationResult, installationId] = await Promise.all([
      usewallet.openapi.getLocation(),
      usewallet.openapi.getInstallationId(),
    ]);

    const location = locationResult.data;

    return {
      city: location.city,
      continent: location.country,
      continentCode: location.countryCode,
      country: location.country,
      countryCode: location.countryCode,
      currency: location.countryCode,
      deviceId: installationId,
      device_id: installationId,
      district: '',
      ip: location.query,
      isp: location.as,
      lat: location.lat,
      lon: location.lon,
      name: 'FRW Chrome Extension',
      org: location.org,
      regionName: location.regionName,
      type: '2',
      userAgent: 'Chrome',
      zip: location.zip,
    };
  }, [usewallet]);

  // 2. WalletConnect Event Handlers
  const onSessionConnected = useCallback(async (_session: SessionTypes.Struct) => {
    setLoadingString(chrome.i18n.getMessage('Scan_Successfully'));
    setSecondLine(chrome.i18n.getMessage('Sync_in_Process'));
  }, []);

  const _subscribeToEvents = useCallback(
    async (client: SignClient) => {
      if (!client) {
        throw new Error('WalletConnect is not initialized');
      }

      client.on('session_update', ({ topic, params }) => {
        const { namespaces } = params;
        const session = client.session.get(topic);
        onSessionConnected({ ...session, namespaces });
      });
    },
    [onSessionConnected]
  );

  // 3. Account and device info handlers, check if account is available based on userid, if not, generate account key and device info
  const handleAccountInfo = useCallback(
    async (wallet: SignClient, topic: string, jsonObject: any) => {
      try {
        await usewallet.checkAvailableAccount(jsonObject.data.userId);
        setIsSwitchingAccount(true);
        setActiveTab(STEPS.PASSWORD);
      } catch (error) {
        setLoadingString('New account login');
        setSecondLine('Waiting for client sync');
        setIsSwitchingAccount(false);

        if (jsonObject.method === FCLWalletConnectMethod.accountInfo) {
          const accountKey = getAccountKey();
          const deviceInfo = await getDeviceInfo();
          const ak = {
            public_key: accountKey.publicKey,
            hash_algo: accountKey.hashAlgo,
            sign_algo: accountKey.signAlgo,
            weight: accountKey.weight,
          };

          setAccountKey(ak);
          setDeviceInfo(deviceInfo);

          try {
            await wallet.request({
              topic,
              chainId: 'flow:mainnet',
              request: {
                method: FCLWalletConnectMethod.addDeviceInfo,
                params: {
                  method: '',
                  data: {
                    username: '',
                    accountKey,
                    deviceInfo,
                  },
                },
              },
            });

            setActiveTab(STEPS.PASSWORD);
          } catch (error) {
            console.error('Error in device info request:', error);
          }
        }
      }
    },
    [getAccountKey, getDeviceInfo, usewallet]
  );

  // 4. Wallet request to fetch account info from client
  const sendRequest = useCallback(
    async (wallet: SignClient, topic: string) => {
      try {
        const result = await wallet.request({
          topic,
          chainId: 'flow:mainnet',
          request: {
            method: FCLWalletConnectMethod.accountInfo,
            params: [],
          },
        });

        setLoadingString('Account info received');
        setSecondLine('Checking account availability');

        const jsonObject = JSON.parse(result as string);
        console.log('FCLWalletConnectMethod.accountInfo', jsonObject.data.userId);

        await handleAccountInfo(wallet, topic, jsonObject);
      } catch (error) {
        console.error('Error in account info request:', error);
      }
    },
    [handleAccountInfo]
  );

  // 5. Main Initialization Effect
  useEffect(() => {
    let wallet: SignClient | null = null;

    const createWeb3Wallet = async () => {
      try {
        // Initialize WalletConnect
        const extensionOrigin = chrome.runtime.id
          ? `chrome-extension://${chrome.runtime.id}`
          : 'https://fcw-link.lilico.app';

        wallet = await SignClient.init({
          core: new Core({
            projectId: process.env.WC_PROJECTID,
          }),
          metadata: {
            name: 'Flow Wallet',
            description: 'Digital wallet created for everyone.',
            url: extensionOrigin,
            icons: ['https://fcw-link.lilico.app/logo.png'],
            redirect: {
              native: 'flowwallet://',
              universal: extensionOrigin,
            },
          },
        });

        // Subscribe to events
        await _subscribeToEvents(wallet);

        // Connect and get URI
        const { uri, approval } = await wallet.connect({
          requiredNamespaces: {
            flow: {
              methods: [FCLWalletConnectMethod.accountInfo, FCLWalletConnectMethod.addDeviceInfo],
              chains: ['flow:mainnet'],
              events: [],
            },
          },
        });

        if (uri) {
          setUri(uri);
          const session = await approval();
          setLoadingString('Scan approved by client');
          setSecondLine('Generating account info');
          await onSessionConnected(session);
          await sendRequest(wallet, session.topic);
        }
      } catch (error) {
        console.error('Error in wallet setup:', error);
      }
    };

    createWeb3Wallet();
  }, [_subscribeToEvents, onSessionConnected, sendRequest]);

  const submitPassword = useCallback(
    async (password: string) => {
      if (isSwitchingAccount) {
        try {
          await usewallet.unlock(password);
          setActiveTab(STEPS.ALL_SET);
        } catch (error) {
          throw new Error(error.message);
        }
      } else {
        try {
          await usewallet.signInV3(mnemonic, accountKey, deviceInfo);
          const userInfo = await usewallet.getUserInfo(true);
          setUsername(userInfo.username);
          await usewallet.saveIndex(userInfo.username);
          await usewallet.boot(password);
          const formatted = mnemonic.trim().split(/\s+/g).join(' ');
          await usewallet.createKeyringWithMnemonics(formatted);
          setActiveTab(STEPS.ALL_SET);
        } catch (error) {
          throw new Error(error.message);
        }
      }
    },
    [usewallet, mnemonic, accountKey, deviceInfo, isSwitchingAccount, setUsername]
  );

  const goBack = () => {
    switch (activeTab) {
      case STEPS.PASSWORD:
        setActiveTab(STEPS.QR);
        break;
      case STEPS.ALL_SET:
        setActiveTab(STEPS.PASSWORD);
        break;
      default:
        history.goBack();
    }
  };

  return (
    <LandingComponents
      activeIndex={0}
      direction="right"
      showBackButton={activeTab !== STEPS.ALL_SET}
      onBack={goBack}
      showConfetti={activeTab === STEPS.ALL_SET}
      showRegisterHeader={true}
    >
      <Box>
        {activeTab === STEPS.QR && (
          <SyncQr uri={uri} loadingString={loadingString} secondLine={secondLine} />
        )}

        {activeTab === STEPS.PASSWORD && (
          <SetPassword
            handleSwitchTab={() => setActiveTab(STEPS.ALL_SET)}
            onSubmit={submitPassword}
            username={username}
            title={
              <>
                {chrome.i18n.getMessage('Welcome__Back')}
                <Box display="inline" color="primary.main">
                  {username}
                </Box>
              </>
            }
            isLogin={isAddWallet}
            autoFocus={true}
          />
        )}

        {activeTab === STEPS.ALL_SET && (
          <AllSet handleSwitchTab={() => window.close()} variant="sync" />
        )}
      </Box>
    </LandingComponents>
  );
};

export default Sync;
