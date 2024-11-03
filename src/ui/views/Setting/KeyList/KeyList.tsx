import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Box, Grid, IconButton } from '@mui/material';
import { Typography } from '@mui/material';
import IconCopy from '../../../../components/iconfont/IconCopy';
import { useWallet } from 'ui/utils';
import { LLHeader } from '@/ui/FRWComponent';
import sequence from '../../../FRWAssets/image/sequence.png';
import hash from '../../../FRWAssets/image/hash.png';
import weight from '../../../FRWAssets/image/weight.png';
import key from '../../../FRWAssets/image/key.png';
import curve from '../../../FRWAssets/image/curve.png';
import toggle from '../../../FRWAssets/image/toggle.png';
import RevokePage from './RevokePage';

interface State {
  password: string;
}

const KeyList = () => {
  const location = useLocation<State>();
  const wallet = useWallet();
  const [privatekey, setKey] = useState('');
  const [publickey, setPublicKey] = useState('')
  const [showKey, setShowkey] = useState(null);
  const [showRevoke, setShowRevoke] = useState(false);
  const [publickeys, setPublicKeys] = useState<any[]>([]);
  const [deviceKey, setDeviceKey] = useState<any[]>([]);
  const [keyIndex, setKeyIndex] = useState<string>('');

  const getAccount = async () => {
    const account = await wallet.getAccount();
    const keys = await wallet.openapi.keyList();
    const installationId = await wallet.openapi.getInstallationId();
    // console.log(';account is ', account)
    const mergedArray = await mergeData({
      result: keys.data.result,
      keys: account.keys
    }, installationId);
    console.log(';account is ', mergedArray)
    setPublicKeys(mergedArray)
  }

  const getUserKeys = async () => {
    const keys = await wallet.openapi.keyList();
    setDeviceKey(keys);
    console.log('keys ', keys);
  }
  const setTab = async () => {
    await wallet.setDashIndex(3);
  };

  const toggleKey = async (index) => {
    if (showKey === index) {
      setShowkey(null)
    } else {
      setShowkey(index)
    }
  };

  async function mergeData(data, installationId) {
    const merged = data.keys.map(key => {
      const matchingResults = data.result.filter(item =>
        item.pubkey.public_key === key.publicKey
      );

      const mergedItem = { ...key };
      console.log('matchingResult ', matchingResults)
      mergedItem.current_device = false;
      mergedItem.devices = matchingResults.map(result => {
        const deviceItem = {
          ...result.pubkey,
          ...key,
          device_name: result.device.device_name
        };
        console.log('matchingResult ', result)

        // Check if the installationId matches device.id
        if (result.device.id === installationId) {
          mergedItem.current_device = true;
        }

        return deviceItem;
      });

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
    getUserKeys();
  }, []);

  const CredentialBox = ({ data }) => {
    return (
      <>
        <Box
          sx={{
            // border: '2px solid #5E5E5E',
            position: 'relative',
            lineBreak: 'anywhere',
            marginBottom: '8px',
          }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                edge='end'
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
        </Box >
      </>
    )
  }

  return (
    <div className="page">
      <LLHeader title={'Account Keys'} help={false} />
      {publickeys.map(item => (
        <Box key={item.index} sx={{ width: '100%', margin: '8px 0' }}>
          <Box sx={{ display: 'flex', position: 'relative', zIndex: '6', justifyContent: ' space-between', height: '54px', padding: '0 20px', alignItems: 'center', margin: '0 18px', borderRadius: '16px', backgroundColor: '#2C2C2C' }}>

            <Typography sx={{ fontWeight: 400, color: '#E6E6E6', fontSize: '14px', marginRight: '8px' }}>Key {item.index + 1} </Typography>

            {item.current_device ? (
              <Typography color="#579AF2" sx={{ padding: '4px 12px', fontSize: '10px', backgroundColor: '#579AF229', borderRadius: '20px' }}>
                Current Device
              </Typography>
            ) : item.revoked ? (
              <Typography color="error.main" sx={{ padding: '4px 12px', fontSize: '10px', backgroundColor: 'error.light', borderRadius: '20px' }}>
                Revoked
              </Typography>
            ) : (
              item.device &&
              <Typography color="#FFFFFF66" sx={{ padding: '4px 12px', fontSize: '10px', backgroundColor: 'rgba(255, 255, 255, 0.16)', borderRadius: '20px' }}>
                {item.device[0].device_name}
              </Typography>
            )}


            <Box sx={{ flex: '1' }}></Box>
            <img src={weight} style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            <Box
              sx={{
                display: 'flex',
                height: '16px',
                width: '72px',
                position: 'relative',
                zIndex: '5',
                overflow: 'hidden',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FFFFFF1A',
                borderRadius: '2px'
              }}
            >
              <Box sx={{
                background: '#FFFFFF33',
                width: `${(item.weight / 1000) * 100}%`, // Calculates the width as a percentage
                height: '16px',
                borderRadius: '2px',
              }}>
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
                  }}>
                  {item.weight}/1000
                </Typography>
              </Box>
            </Box>
            <Box onClick={(() => toggleKey(item.index))} sx={{ display: 'flex', alignItems: 'center', marginLeft: '14px' }}>
              <img
                src={toggle}
                style={{
                  width: '10px',
                  height: '6px',
                  transform: showKey === item.index ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s'
                }}
              />

            </Box>
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
              borderRadius: '16px'
            }}
          >

            <CredentialBox data={item.publicKey} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center', }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center', }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center', }}>
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
            {(!item.current_device && !item.revoked) &&
              <Box sx={{ backgroundColor: 'rgba(44, 44, 44, 0.75)', borderRadius: '2px' }} onClick={(() => toggleRevoke(item))}>
                <Typography color='error.main' sx={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, padding: '8px 0' }}>
                  Revoke
                </Typography>
              </Box>

            }
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