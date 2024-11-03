import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Box, Grid, IconButton } from '@mui/material';
import { Typography } from '@mui/material';
import { useRouteMatch } from 'react-router-dom';
import IconCopy from '../../../../components/iconfont/IconCopy';
import { useWallet } from 'ui/utils';
import { LLHeader } from '@/ui/FRWComponent';
import { pk2PubKey } from '../../../utils/modules/passkey';
import { storage } from '@/background/webapi';
interface State {
  password: string;
}

const Keydetail = () => {
  const location = useLocation<State>();
  const match = useRouteMatch();
  const wallet = useWallet();
  const [privatekey, setKey] = useState('');
  const [publickey, setPublicKey] = useState('');

  const verify = async () => {
    const pwd = location.state.password;
    const result = await wallet.getKey(pwd);
    // const privateKey = hdwallet
    //   .derive("m/44'/539'/0'/0/0")
    //   .getPrivateKey()
    //   .toString('hex');
    setKey(result);
    const pubKey = await storage.get('pubKey');
    setPublicKey(pubKey);
  }

  const setTab = async () => {
    await wallet.setDashIndex(3);
  };

  useEffect(() => {
    setTab();
    verify();
  }, []);

  const CredentialBox = ({ data }) => {
    return (
      <>
        <Box
          sx={{
            // border: '2px solid #5E5E5E',
            borderRadius: '12px',
            position: 'relative',
            width: '364px',
            marginLeft: '17px',
            padding: '5px 16px',
            lineBreak: 'anywhere',
            marginTop: '0px',
            backgroundColor: '#333333',
          }}>
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
              padding: '16px 0',
            }}
          >
            {data}
          </Typography>
          <Grid container direction="row" justifyContent="end" alignItems="end">
            <IconButton
              edge='end'
              onClick={() => {
                navigator.clipboard.writeText(data);
              }}
            // sx={{ marginLeft:'380px'}}
            >
              <IconCopy
                style={{
                  height: '20px',
                  width: '20px',
                }}
              />
            </IconButton>
          </Grid>
        </Box>
      </>
    )
  }

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Private__Key')} help={false} />
      <Typography variant="body1" align="left" py="14px" px="20px" fontSize="17px">
        {chrome.i18n.getMessage('Private__Key')}
      </Typography>
      <CredentialBox data={privatekey} />
      <br />
      <Typography variant="body1" align="left" py="14px" px="20px" fontSize="17px">
        {chrome.i18n.getMessage('Public__Key')}
      </Typography>
      <CredentialBox data={publickey} />
      <br />

      <Box
        sx={{
          display: 'flex',
          px: '20px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '30px'
        }}
      >
        <Box
          sx={{
            borderLeft: 1,
            px: '15px',
            borderColor: '#333333'
          }}
        >
          <Typography variant="body1" color="text.secondary" align="left" fontSize="14px">
            {chrome.i18n.getMessage('Hash__Algorithm')} <br />
            SHA2_256
          </Typography>
        </Box>
        <Box
          sx={{
            borderLeft: 1,
            borderColor: '#333333',
            px: '15px'
          }}
        >
          <Typography variant="body1" color="text.secondary" align="left" fontSize="14px">
            {chrome.i18n.getMessage('Sign__Algorithm')} <br />
            ECDSA_secp256k1
          </Typography>
        </Box>
      </Box>
    </div>


  );
};

export default Keydetail;