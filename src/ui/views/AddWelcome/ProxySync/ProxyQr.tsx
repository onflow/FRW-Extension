import React, { useEffect, useCallback, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, ThemeProvider } from '@mui/system';
import {
  Button,
  Typography,
  FormControl,
  Input,
  InputAdornment,
  CssBaseline,
} from '@mui/material';
import theme from '../../../style/LLTheme';
import { useWallet } from 'ui/utils';
import { Core } from '@walletconnect/core';
import { FCLWalletConnectMethod } from '@/ui/utils/type';
import SignClient from '@walletconnect/sign-client';
import { PairingTypes, SessionTypes } from '@walletconnect/types';
import * as bip39 from 'bip39';
import { storage } from 'background/webapi';
import { QRCode } from 'react-qrcode-logo';
import lilo from 'ui/FRWAssets/image/lilo.png';

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

const useStyles = makeStyles((theme) => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));


const ProxyQr = ({ handleClick, savedUsername, confirmMnemonic, confirmPk, setUsername, setAccountKey, setDeviceInfo }) => {
  const usewallet = useWallet();
  const classes = useStyles();
  const [Uri, setUri] = useState('');
  const [web3wallet, setWeb3Wallet] = useState<any>(null);
  const [loading, setShowLoading] = useState<boolean>(false);
  const [session, setSession] = useState<SessionTypes.Struct>();
  const [mnemonic, setMnemonic] = useState(bip39.generateMnemonic());
  const [currentNetwork, setNetwork] = useState(process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet');

  const loadNetwork = async () => {
    const currentNetwork = await usewallet.getNetwork();
    setNetwork(currentNetwork)
  }

  useEffect(() => {
    loadNetwork()
  }, [])

  useEffect(() => {
    const createWeb3Wallet = async () => {

      try {
        const wallet = await SignClient.init({
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Unreachable code error
          core: new Core({
            projectId: process.env.WC_PROJECTID,
          }),
          metadata: {
            name: 'Flow Walllet',
            description: 'Digital wallet created for everyone.',
            url: 'https://fcw-link.lilico.app',
            icons: ['https://fcw-link.lilico.app/logo.png']
          },
        });
        await _subscribeToEvents(wallet);

        try {
          const { uri, approval } = await wallet.connect({
            requiredNamespaces: {
              flow: {
                methods: [
                  FCLWalletConnectMethod.accountInfo,
                  FCLWalletConnectMethod.proxysign,
                  FCLWalletConnectMethod.proxyaccount,
                  FCLWalletConnectMethod.addDeviceInfo
                ],
                chains: [`flow:${currentNetwork}`],
                events: []
              }
            }
          })

          // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
          if (uri) {
            console.log('uri ', uri)
            await setUri(uri);
            // Await session approval from the wallet.
            const session = await approval()
            await onSessionConnected(session);

            sendRequest(wallet, session.topic);

            // onSessionConnect(session)
            // Close the QRCode modal in case it was open.
          }
        } catch (e) {
          console.error(e)
        }
        await setWeb3Wallet(wallet);
      } catch (e) {
        console.error(e);
      }
    };
    createWeb3Wallet();
  }, []);




  const onSessionConnected = useCallback(
    async (_session: SessionTypes.Struct) => {
      console.log('_session ', _session)
      setShowLoading(true);
      setSession(_session);

    },
    []
  );



  const _subscribeToEvents = useCallback(
    async (_client: SignClient) => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized');
      }

      _client.on('session_update', ({ topic, params }) => {
        console.log('EVENT', 'session_update', { topic, params });
        const { namespaces } = params;
        const _session = _client.session.get(topic);
        const updatedSession = { ..._session, namespaces };
        onSessionConnected(updatedSession);
      });
      console.log('EVENT _client ', _client)

    },
    [onSessionConnected]
  );


  async function sendRequest(wallet: SignClient, topic: string) {
    console.log(wallet)
    const deviceInfo: DeviceInfoRequest = await getDeviceInfo();
    const jwtToken = await usewallet.requestProxyToken();
    wallet.request({
      topic: topic,
      chainId: `flow:${currentNetwork}`,
      request: {
        method: FCLWalletConnectMethod.proxyaccount,
        params: {
          method: FCLWalletConnectMethod.proxyaccount,
          data: {
            deviceInfo: deviceInfo,
            jwt: jwtToken
          }
        },
      },
    }).then(async (result: any) => {
      console.log(result);
      const jsonObject = JSON.parse(result);
      const accountKey = {
        public_key: jsonObject.data.publicKey,
        hash_algo: Number(jsonObject.data.hashAlgo),
        sign_algo: Number(jsonObject.data.signAlgo),
        weight : Number(jsonObject.data.weight)
      }
      usewallet.openapi.loginV3(accountKey, deviceInfo, jsonObject.data.signature);
      storage.set(`${jsonObject.data.userId}Topic`, topic);
      confirmMnemonic(mnemonic);
      confirmPk(jsonObject.data.publicKey)
      console.log('jsonObject ', jsonObject);
      handleClick();
    }).catch((error) => {
      console.error('Error in first wallet request:', error);
    });


  }


  const getDeviceInfo = async (): Promise<DeviceInfoRequest> => {
    const result = await usewallet.openapi.getLocation();
    const installationId = await usewallet.openapi.getInstallationId();
    // console.log('location ', userlocation);
    const userlocation = result.data
    const deviceInfo: DeviceInfoRequest = {

      'city': userlocation.city,
      'continent': userlocation.country,
      'continentCode': userlocation.countryCode,
      'country': userlocation.country,
      'countryCode': userlocation.countryCode,
      'currency': userlocation.countryCode,
      deviceId: installationId,
      device_id: installationId,
      'district': '',
      'ip': userlocation.query,
      'isp': userlocation.as,
      'lat': userlocation.lat,
      'lon': userlocation.lon,
      'name': 'FRW Chrome Extension',
      'org': userlocation.org,
      'regionName': userlocation.regionName,
      'type': '2',
      'userAgent': 'Chrome',
      'zip': userlocation.zip,

    };
    return deviceInfo;
  }







  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          px: '60px',
          backgroundColor: '#222',
          height: '380px',
          width: '620px',
          position: 'relative',
          borderRadius: '24px'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: '-95px',
            top: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            width: '700px'

          }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '20px',
              width: '353px',
            }}
          >

            <Typography
              variant="h4"
              sx={{
                fontWeight: '700',
                fontSize: '40px',
                WebkitBackgroundClip: 'text',
                color: '#fff',
                lineHeight: '56px'
              }}
            >
              {chrome.i18n.getMessage('Sync_')} <span style={{ display: 'inline-block', width: '353px' }}>
                {chrome.i18n.getMessage('Lilico')}</span>
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: 'primary.light', pt: '16px', fontSize: '16px', margin: '24px 0 32px' }}
            >
              {/* {chrome.i18n.getMessage('appDescription')} {' '} */}

              {chrome.i18n.getMessage('Open_your_Flow_Reference_on_Mobil')}
            </Typography>


            <Typography
              variant="body1"
              sx={{ color: '#8C9BAB', pt: '12px', fontSize: '12px' }}
            >
              {/* {chrome.i18n.getMessage('appDescription')} {' '} */}

              {chrome.i18n.getMessage(' Note_Your_recovery_phrase_will_not')}
            </Typography>
          </Box>

          <Box
            sx={{
              padding: '0 40px 0 50px',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              width: '347px'
            }}
          >
            {/* <Box>
              <Typography sx={{
                width: '347px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}>{Uri}</Typography>
              <button onClick={copyToClipboard}>Copy Uri</button>
              {copySuccess && <Box>{copySuccess}</Box>}
            </Box> */}
            {Uri &&
              <Box>
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ borderRadius: '24px', width: '277px', height: '277px', display: 'flex', overflow: 'hidden' }}>
                    <QRCode
                      size={237}
                      style={{ height: 'auto', maxWidth: '100%', width: '100%', borderRadius: '24px' }}
                      value={Uri}
                      logoImage={lilo}
                      eyeColor={'#41CC5D'}
                      eyeRadius={24}
                      quietZone={20}
                    />
                  </Box>
                  {loading &&
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '277px',
                        height: '277px',
                        position: 'absolute',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        top: '0',
                        borderRadius: '24px'
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          width: '150px',
                          color: '#41CC5D',
                          lineHeight: '24px',
                          fontWeight: '700',
                          pt: '14px', fontSize: '14px',
                          textAlign: 'center',
                        }}
                      >

                        {chrome.i18n.getMessage('Scan_Successfully')}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          width: '150px',
                          color: '#41CC5D',
                          lineHeight: '24px',
                          fontWeight: '700',
                          fontSize: '14px',
                          textAlign: 'center',
                        }}
                      >

                        {chrome.i18n.getMessage('Sync_in_Process')}
                      </Typography>

                    </Box>
                  }
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: ' rgba(255, 255, 255, 0.80))'
                    , pt: '14px', fontSize: '14px', textAlign: 'center'
                  }}
                >
                  {/* {chrome.i18n.getMessage('appDescription')} {' '} */}
                  {chrome.i18n.getMessage('Scan_QR_Code_with_Mobile')}
                </Typography>
              </Box>
            }
          </Box>
        </Box>
      </Box>


      {/* <Box sx={{ flexGrow: 1 }} /> */}

    </ThemeProvider>
  );
};

export default ProxyQr;
