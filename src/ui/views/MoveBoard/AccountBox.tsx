import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { useWallet, formatAddress } from 'ui/utils';
import { ensureEvmAddressPrefix, formatString } from 'ui/utils/address';
import {
  Typography,
  Box,
  CardMedia
} from '@mui/material';
import { FRWProfileCard, FWMoveDropdown } from 'ui/FRWComponent';
import accountMove from 'ui/FRWAssets/svg/accountMove.svg';
import emoji from 'background/utils/emoji.json';
import { storage } from '@/background/webapi';


function AccountBox({ isChild, setSelectedChildAccount, selectedAccount, isEvm = false }) {
  const usewallet = useWallet();
  const userContact = {
    contact_name: '',
    avatar: '',
  }

  const [first, setFirst] = useState<string>('');
  const [second, setSecond] = useState<string>('');
  const [userInfo, setUser] = useState<any>(userContact);
  const [firstEmoji, setFirstEmoji] = useState<any>(null);
  const [secondEmoji, setSecondEmoji] = useState<any>(null);
  const [childWallets, setChildWallets] = useState({});

  const requestAddress = async () => {

    const parentAddress = await usewallet.getMainAddress();
    const address = await usewallet.getCurrentAddress();
    const childResp = await usewallet.checkUserChildAccount();
    const emojires = await usewallet.getEmoji();
    const eWallet = await usewallet.getEvmWallet();
    let evmAddress
    if (eWallet.address) {
      evmAddress = ensureEvmAddressPrefix(eWallet.address)
    }

    const newWallet = {
      [parentAddress!]: {
        "name": emojires[0].name,
        "description": emojires[0].name,
        "thumbnail": {
          "url": emojires[0].emoji
        }
      }
    };


    // Merge wallet lists
    const walletList = { ...newWallet, ...childResp, };
    const firstWalletAddress = Object.keys(walletList)[0];
    const wallet = walletList[firstWalletAddress];
    setChildWallets(walletList);

    userContact.avatar = wallet.thumbnail.url;
    userContact.contact_name = wallet.name;
    if (firstWalletAddress) {
      setSelectedChildAccount(walletList[firstWalletAddress]);
    }
    setUser(userContact);
    if (isEvm) {
      setFirst(evmAddress!)
      setFirstEmoji(emojires[1])

    } else {
      setFirst(address!)
    }
    setSecond(parentAddress!)
    setSecondEmoji(emojires[0])
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

        <Box sx={{ padding: '16px 12px', height: '106px', flex: '1', backgroundColor: '#2C2C2C', borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Box sx={{
              display: 'flex', height: '32px', width: '32px', borderRadius: '32px', justifyContent: 'center', alignItems: 'center', backgroundColor: firstEmoji ? firstEmoji['bgcolor'] : 'none', marginRight: '4px'
            }}>
              {firstEmoji ?
                <Typography sx={{ fontSize: '12px', fontWeight: '400' }}>
                  {firstEmoji.emoji}
                </Typography>
                :
                <CardMedia sx={{ margin: '0 auto', width: '20px', height: '20px', borderRadius: '20px', display: 'block' }} image={userInfo.avatar} />
              }
            </Box>
          </Box>
          <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
            {firstEmoji ? firstEmoji.name : userInfo.contact_name}
          </Typography>
          <Typography sx={{ fontSize: '10px', fontWeight: '400' }}>
            {first && formatString(first)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mx: '8px' }}>
          <CardMedia sx={{ width: '24px', height: '24px', }} image={accountMove} />
        </Box>
        <Box sx={{ padding: '16px 12px', height: '106px', flex: '1', backgroundColor: '#2C2C2C', borderRadius: '12px' }}>
          {selectedAccount && (
            <FWMoveDropdown
              contact={selectedAccount}
              contacts={childWallets}
              setSelectedChildAccount={setSelectedChildAccount}
            />
          )}
        </Box>
      </Box>
      <Box sx={{padding:'8px 0'}}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{fontSize:'12px',fontWeight:'600'}}>Move Fee</Typography>
          <Typography sx={{fontSize:'12px',fontWeight:'600'}}>0.001 FLOW</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{fontSize:'12px',fontWeight:'400', color: 'rgba(255, 255, 255, 0.60)'}}>It appears when moving between VM accounts</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default AccountBox; 