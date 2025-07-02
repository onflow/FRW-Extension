import { Box } from '@mui/material';
import { Core } from '@walletconnect/core';
import SignClient from '@walletconnect/sign-client';
import { type SessionTypes } from '@walletconnect/types';
import * as bip39 from 'bip39';
import HDWallet from 'ethereum-hdwallet';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';

import { isValidFlowAddress, withPrefix } from '@/shared/utils/address';
import {
  SIGN_ALGO_NUM_ECDSA_secp256k1,
  HASH_ALGO_NUM_SHA2_256,
} from '@/shared/utils/algo-constants';
import { consoleError } from '@/shared/utils/console-log';
import { FCLWalletConnectMethod, type FCLWalletConnectSyncAccountInfo } from '@/shared/utils/type';
import AllSet from '@/ui/components/LandingPages/AllSet';
import LandingComponents from '@/ui/components/LandingPages/LandingComponents';
import SetPassword from '@/ui/components/LandingPages/SetPassword';
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
  const navigate = useNavigate();
  const usewallet = useWallet();
  const [activeTab, setActiveTab] = useState<StepType>(STEPS.QR);
  const [mnemonic] = useState(bip39.generateMnemonic());
  const [uri, setUri] = useState('');
  const [loadingString, setLoadingString] = useState<string | null>(null);
  const [secondLine, setSecondLine] = useState<string>('');
  const [isSwitchingAccount, setIsSwitchingAccount] = useState<boolean>(true);
  const [isAddWallet, setIsAddWallet] = useState<boolean>(false);
  const [addressToImport, setAddressToImport] = useState<string>('');

  const isSignClientInitialized = useRef(false);

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
          navigate('/');
        }
      })
      .catch(() => {
        return;
      });
  }, [usewallet, navigate]);

  useEffect(() => {
    loadView();
  }, [loadView]);

  // 1. Initial Setup Functions - These are created once when component mounts
  /**
   * Get the account key from the mnemonic
   * @returns {Object} The account key
   * TODO: move this to the background to use existing getAccountKey function
   */
  const getAccountKey = useCallback(() => {
    const hdwallet = HDWallet.fromMnemonic(mnemonic);
    const publicKey = hdwallet.derive("m/44'/539'/0'/0/0").getPublicKey().toString('hex');

    return {
      hashAlgo: HASH_ALGO_NUM_SHA2_256,
      signAlgo: SIGN_ALGO_NUM_ECDSA_secp256k1,
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
    async (signClient: SignClient) => {
      if (!signClient) {
        throw new Error('WalletConnect is not initialized');
      }

      signClient.on('session_update', ({ topic, params }) => {
        const { namespaces } = params;
        const session = signClient.session.get(topic);
        onSessionConnected({ ...session, namespaces });
      });
    },
    [onSessionConnected]
  );

  // 3. Account and device info handlers, check if account is available based on userid, if not, generate account key and device info
  const handleAccountInfo = useCallback(
    async (signClient: SignClient, topic: string, jsonObject: FCLWalletConnectSyncAccountInfo) => {
      try {
        setAddressToImport(jsonObject.data.walletAddress);
        const address = withPrefix(jsonObject.data.walletAddress);
        if (!isValidFlowAddress(address)) {
          throw new Error('Invalid address');
        }
        const availableKeys = await usewallet.checkAvailableAccountKeys(address);
        if (availableKeys.length < 1) {
          throw new Error('No available keys found for account: ' + address);
        }
        setIsSwitchingAccount(true);
        setActiveTab(STEPS.PASSWORD);
      } catch {
        setLoadingString('New account login');
        setSecondLine('Waiting for client sync');
        setIsSwitchingAccount(false);

        if (jsonObject.method === FCLWalletConnectMethod.accountInfo) {
          const accountKey = getAccountKey();
          const deviceInfo = await getDeviceInfo();

          try {
            await signClient.request({
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
            consoleError('Error in device info request:', error);
          }
        }
      }
    },
    [getAccountKey, getDeviceInfo, usewallet]
  );

  // 4. Wallet request to fetch account info from client
  const sendRequest = useCallback(
    async (signClient: SignClient, topic: string) => {
      try {
        const result = await signClient.request({
          topic,
          chainId: 'flow:mainnet',
          request: {
            method: FCLWalletConnectMethod.accountInfo,
            params: [],
          },
        });

        setLoadingString('Account info received');
        setSecondLine('Checking account availability');

        const jsonObject: FCLWalletConnectSyncAccountInfo = JSON.parse(result as string);
        await handleAccountInfo(signClient, topic, jsonObject);
      } catch (error) {
        consoleError('Error in account info request:', error);
      }
    },
    [handleAccountInfo]
  );

  // 5. Main Initialization Effect
  useEffect(() => {
    if (isSignClientInitialized.current) {
      return;
    }

    const createWeb3Wallet = async () => {
      let signClient: SignClient | null = null;

      try {
        isSignClientInitialized.current = true;

        // Initialize WalletConnect
        const extensionOrigin = chrome.runtime.id
          ? `chrome-extension://${chrome.runtime.id}`
          : 'https://fcw-link.lilico.app';

        signClient = await SignClient.init({
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
        await _subscribeToEvents(signClient);

        // Connect and get URI
        const { uri, approval } = await signClient.connect({
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
          await sendRequest(signClient, session.topic);
        }
      } catch (error) {
        consoleError('Error in wallet setup:', error);
        isSignClientInitialized.current = false; // Reset on error
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
          const formattedMnemonic = mnemonic.trim().split(/\s+/g).join(' ');

          await usewallet.importAccountFromMobile(addressToImport, password, formattedMnemonic);

          setActiveTab(STEPS.ALL_SET);
        } catch (error) {
          throw new Error(error.message);
        }
      }
    },
    [isSwitchingAccount, usewallet, mnemonic, addressToImport]
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
        navigate(-1);
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
          <SetPassword onSubmit={submitPassword} isLogin={isAddWallet} />
        )}

        {activeTab === STEPS.ALL_SET && (
          <AllSet handleSwitchTab={() => window.close()} variant="sync" />
        )}
      </Box>
    </LandingComponents>
  );
};

export default Sync;
