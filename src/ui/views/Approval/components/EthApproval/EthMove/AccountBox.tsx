import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { useWallet } from 'ui/utils';
import { formatString } from 'ui/utils/address';
import {
  Typography,
  Box,
  CardMedia
} from '@mui/material';
import accountMove from 'ui/FRWAssets/svg/accountMove.svg';
import emoji from 'background/utils/emoji.json';
import { storage } from '@/background/webapi';


function AccountBox({ isEvm }) {
  const usewallet = useWallet();

  const [first, setFirst] = useState<string>('');
  const [second, setSecond] = useState<string>('');
  const [userInfo, setUser] = useState<any>(null);
  const [firstEmoji, setFirstEmoji] = useState<any>(null);
  const [secondEmoji, setSecondEmoji] = useState<any>(null);

  const requestAddress = async () => {
    const userContact = {
      contact_name: '',
      avatar: '',
    }
    const info = await usewallet.getUserInfo(false);
    userContact.avatar = info.avatar;
    userContact.contact_name = info.username;
    setUser(userContact);

    let evmAddress = await usewallet.getEvmAddress();
    evmAddress = formatString(evmAddress);
    const address = await usewallet.getCurrentAddress();


    const emojires = await usewallet.getEmoji();

    if (isEvm) {
      setFirst(evmAddress)
      setSecond(address!)
      setFirstEmoji(emojires[1])
      setSecondEmoji(emojires[0])
    } else {
      setFirst(address!)
      setSecond(evmAddress)
      setFirstEmoji(emojires[0])
      setSecondEmoji(emojires[1])
    }
  }


  useEffect(() => {
    requestAddress();
  }, [])

  return (
    <Box sx={{ padding: '0 18px' }}>
      <Typography sx={{ mb: '8px' }}>
        {chrome.i18n.getMessage('Account')}
      </Typography>

      < Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

        <Box sx={{ padding: '8px 12px', height: '60px', flex: '1', backgroundColor: '#2C2C2C', borderRadius: '12px' }}>
          {firstEmoji &&
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Box sx={{
                display: 'flex', height: '20px', width: '20px', borderRadius: '20px', justifyContent: 'center', alignItems: 'center', backgroundColor: firstEmoji['bgcolor'], marginRight: '4px'
              }}>
                <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
                  {firstEmoji.emoji}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
                {firstEmoji.name}
              </Typography>
              {isEvm &&
                <Typography
                  variant="body1"
                  component="span"
                  color="#FFF"
                  fontSize={'9px'}
                  sx={{
                    backgroundColor: '#627EEA',
                    padding: '0 8px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    marginLeft: '8px',
                    lineHeight: '16px',
                    height: '16px'
                  }}
                >
                  EVM
                </Typography>
              }
            </Box>
          }
          <Typography sx={{ fontSize: '10px', fontWeight: '400' }}>
            {first}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mx: '8px' }}>
          <CardMedia sx={{ width: '24px', height: '24px', }} image={accountMove} />
        </Box>
        <Box sx={{ padding: '8px 12px', height: '60px', flex: '1', backgroundColor: '#2C2C2C', borderRadius: '12px' }}>
          {secondEmoji &&
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Box sx={{
                display: 'flex', height: '20px', width: '20px', borderRadius: '20px', justifyContent: 'center', alignItems: 'center', backgroundColor: secondEmoji['bgcolor'], marginRight: '4px'
              }}>
                <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
                  {secondEmoji.emoji}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
                {secondEmoji.name}
              </Typography>
              {!isEvm &&
                <Typography
                  variant="body1"
                  component="span"
                  color="#FFF"
                  fontSize={'9px'}
                  sx={{
                    backgroundColor: '#627EEA',
                    padding: '0 8px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    marginLeft: '8px',
                    lineHeight: '16px',
                    height: '16px'
                  }}
                >
                  EVM
                </Typography>
              }
            </Box>
          }
          <Typography sx={{ fontSize: '10px', fontWeight: '400' }}>
            {second}
          </Typography>
        </Box>
      </Box>

    </Box>
  );
}

export default AccountBox; 