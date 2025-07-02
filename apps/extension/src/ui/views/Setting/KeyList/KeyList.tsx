import { Box, IconButton, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { type KeyResponseItem, type AccountKey } from '@/shared/types/network-types';
import { LLHeader } from '@/ui/components';
import IconCopy from '@/ui/components/iconfont/IconCopy';
import { useWallet } from 'ui/utils';

import curve from '../../../assets/image/curve.png';
import hash from '../../../assets/image/hash.png';
import key from '../../../assets/image/key.png';
import sequence from '../../../assets/image/sequence.png';
import toggle from '../../../assets/image/toggle.png';
import weight from '../../../assets/image/weight.png';

import RevokePage from './RevokePage';

const KeyList = () => {
  const wallet = useWallet();
  const location = useLocation();
  const address = new URLSearchParams(location.search).get('address') || '';
  const [showKey, setShowkey] = useState(null);
  const [showRevoke, setShowRevoke] = useState(false);
  const [publickeys, setPublicKeys] = useState<any[]>([]);
  const [keyIndex, setKeyIndex] = useState<string>('');

  const getAccount = useCallback(async () => {
    const keys = await wallet.openapi.keyList();

    const account = await wallet.getAccountInfo(address);
    const installationId = await wallet.openapi.getInstallationId();
    const mergedArray = await mergeData(
      {
        result: keys.data.result,
        keys: account.keys,
      },
      installationId
    );
    setPublicKeys(mergedArray);
  }, [wallet, address]);

  const setTab = useCallback(async () => {
    await wallet.setDashIndex(3);
  }, [wallet]);

  const toggleKey = async (index) => {
    if (showKey === index) {
      setShowkey(null);
    } else {
      setShowkey(index);
    }
  };

  async function mergeData(
    data: { result: KeyResponseItem[]; keys: AccountKey[] },
    installationId: string
  ) {
    const merged = data.keys.map((key) => {
      const matchingResults = data.result.filter(
        (item) => item.pubkey.public_key === key.publicKey
      );

      const mergedItem = {
        ...key,
        current_device: matchingResults.some((result) => result.device.id === installationId),
        devices: matchingResults.map((result) => {
          return {
            ...result.pubkey,
            ...key,
            device_name: result.device.device_name,
          };
        }),
      };

      return mergedItem;
    });

    return merged;
  }

  const toggleRevoke = async (item) => {
    setKeyIndex(item.index);
    setShowRevoke(true);
  };

  useEffect(() => {
    setTab();
    getAccount();
  }, [getAccount, setTab]);

  const CredentialBox = ({ data }) => {
    return (
      <>
        <Box
          sx={{
            // border: '2px solid #5E5E5E',
            position: 'relative',
            lineBreak: 'anywhere',
            marginBottom: '8px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <img src={key} style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.80)',
                fontSize: '12px',
                fontWeight: 400,
              }}
            >
              Public Key
            </Typography>
            <Box sx={{ flex: '1' }}></Box>
            <Box>
              <IconButton
                edge="end"
                style={{
                  padding: '0px',
                  width: '16px',
                }}
                onClick={() => {
                  navigator.clipboard.writeText(data);
                }}
                // sx={{ marginLeft:'380px'}}
              >
                <IconCopy
                  style={{
                    height: '16px',
                    width: '16px',
                  }}
                />
              </IconButton>
            </Box>
          </Box>
          <Typography
            variant="body1"
            display="inline"
            color="text.secondary"
            sx={{
              alignSelf: 'center',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '24px',
              // color: '#E6E6E6',
              padding: '4px 0',
            }}
          >
            {data}
          </Typography>
        </Box>
      </>
    );
  };

  return (
    <div className="page">
      <LLHeader title={'Account Keys'} help={false} />
      {publickeys.map((item) => (
        <Box key={item.index} sx={{ width: '100%', margin: '8px 0' }}>
          <Box
            sx={{
              display: 'flex',
              position: 'relative',
              zIndex: '6',
              justifyContent: ' space-between',
              height: '54px',
              padding: '0 20px',
              alignItems: 'center',
              margin: '0 18px',
              borderRadius: '16px',
              backgroundColor: '#2C2C2C',
            }}
          >
            <Typography
              sx={{ fontWeight: 400, color: '#E6E6E6', fontSize: '14px', marginRight: '8px' }}
            >
              Key {item.index + 1}{' '}
            </Typography>

            {item.current_device ? (
              <Typography
                color="#579AF2"
                sx={{
                  padding: '4px 12px',
                  fontSize: '10px',
                  backgroundColor: '#579AF229',
                  borderRadius: '20px',
                }}
              >
                Current Device
              </Typography>
            ) : item.revoked ? (
              <Typography
                color="error.main"
                sx={{
                  padding: '4px 12px',
                  fontSize: '10px',
                  backgroundColor: 'error.light',
                  borderRadius: '20px',
                }}
              >
                Revoked
              </Typography>
            ) : (
              item.device && (
                <Typography
                  color="#FFFFFF66"
                  sx={{
                    padding: '4px 12px',
                    fontSize: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    borderRadius: '20px',
                  }}
                >
                  {item.device[0].device_name}
                </Typography>
              )
            )}

            <Box sx={{ flex: '1' }}></Box>
            <img src={weight} style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            <Box
              sx={{
                display: 'flex',
                width: '72px',
                position: 'relative',
                zIndex: '5',
                overflow: 'hidden',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FFFFFF1A',
                borderRadius: '2px',
              }}
            >
              <Box
                sx={{
                  background: '#FFFFFF33',
                  width: `${(item.weight / 1000) * 100}%`, // Calculates the width as a percentage
                  height: '16px',
                  borderRadius: '2px',
                }}
              >
                <Typography
                  sx={{
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 400,
                    textAlign: 'center',
                    display: 'absolute',
                    lineHeight: '16px',
                    height: '16px',
                    width: '72px',
                  }}
                >
                  {item.weight}/1000
                </Typography>
              </Box>
            </Box>
            <IconButton
              sx={{ marginLeft: '14px', height: '26px' }}
              onClick={() => toggleKey(item.index)}
            >
              <img
                src={toggle}
                style={{
                  transform: showKey === item.index ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: showKey === item.index ? 'flex' : 'none',
              maxHeight: showKey === item.index ? '308px' : '0',
              height: 'auto',
              position: 'relative',
              zIndex: '5',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              flexDirection: 'column',
              padding: '31px 12px 12px',
              margin: '-19px 26px 0',
              backgroundColor: 'rgba(34, 34, 34, 0.75)',
              borderRadius: '16px',
            }}
          >
            <CredentialBox data={item.publicKey} />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <img src={curve} style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.80)',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              >
                Curve
              </Typography>
              <Box sx={{ flex: '1' }}></Box>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {item.signAlgoString}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <img src={hash} style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.80)',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              >
                Hash
              </Typography>
              <Box sx={{ flex: '1' }}></Box>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {item.hashAlgoString}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <img src={sequence} style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.80)',
                  fontSize: '12px',
                  fontWeight: 400,
                }}
              >
                Sequence Number
              </Typography>
              <Box sx={{ flex: '1' }}></Box>
              <Typography
                sx={{
                  color: '#FFFFFF66',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {item.sequenceNumber}
              </Typography>
            </Box>
            {!item.current_device && !item.revoked && (
              <Box
                sx={{ backgroundColor: 'rgba(44, 44, 44, 0.75)', borderRadius: '2px' }}
                onClick={() => toggleRevoke(item)}
              >
                <Typography
                  color="error.main"
                  sx={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, padding: '8px 0' }}
                >
                  Revoke
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ))}

      <RevokePage
        isAddAddressOpen={showRevoke}
        handleCloseIconClicked={() => setShowRevoke(false)}
        handleCancelBtnClicked={() => setShowRevoke(false)}
        handleAddBtnClicked={() => {
          setShowRevoke(false);
        }}
        keyIndex={keyIndex}
      />
    </div>
  );
};

export default KeyList;
