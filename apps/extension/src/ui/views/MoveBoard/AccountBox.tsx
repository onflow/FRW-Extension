import { Box, CardMedia, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { type Contact } from '@onflow/flow-wallet-shared/types/network-types';
import { formatString } from '@onflow/flow-wallet-shared/utils/address';

import accountMove from '@/ui/assets/svg/accountMove.svg';
import { FWMoveDropdown } from '@/ui/components';
import { useContacts } from '@/ui/hooks/useContactHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
const USER_CONTACT = {
  contact_name: '',
  avatar: '',
};

function AccountBox({ isChild, setSelectedChildAccount, selectedAccount, isEvm = false }) {
  const { childAccountsContacts, evmAccounts, mainAccountContact } = useContacts();
  const { mainAddress, evmAddress, currentWallet, evmWallet, payer } = useProfiles();
  const [first, setFirst] = useState<string>('');
  const [second, setSecond] = useState<string>('');
  const [userInfo, setUser] = useState<any>(USER_CONTACT);
  const [firstEmoji, setFirstEmoji] = useState<any>(null);
  const [childWallets, setChildWallets] = useState<Contact[]>([]);

  const requestAddress = useCallback(async () => {
    const address = currentWallet.address;
    const walletList = [...childAccountsContacts, ...mainAccountContact, ...evmAccounts].filter(
      (account) => account.address !== currentWallet.address
    );

    const firstWallet = walletList[0];
    setChildWallets(walletList);

    const userContact = {
      avatar: currentWallet.icon,
      contact_name: currentWallet.name,
    };
    if (firstWallet) {
      setSelectedChildAccount(firstWallet);
    }
    setUser(userContact);
    if (isEvm) {
      setFirst(evmAddress!);
      setFirstEmoji(evmWallet);
    } else {
      setFirst(address!);
    }
    setSecond(mainAddress!);
  }, [
    isEvm,
    evmAddress,
    mainAddress,
    setSelectedChildAccount,
    childAccountsContacts,
    evmAccounts,
    mainAccountContact,
    currentWallet,
    evmWallet,
  ]);

  useEffect(() => {
    requestAddress();
  }, [requestAddress]);

  return (
    <Box sx={{ padding: '0 18px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box
          sx={{
            padding: '16px 12px',
            height: '106px',
            flex: '1',
            backgroundColor: '#2C2C2C',
            borderRadius: '12px',
            flexDirection: 'column',
            display: 'flex',
            gap: '5px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                height: '32px',
                width: '32px',
                borderRadius: '32px',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: firstEmoji ? firstEmoji['color'] : 'none',
                marginRight: '4px',
              }}
            >
              {firstEmoji ? (
                <Typography sx={{ fontSize: '12px', fontWeight: '400' }}>
                  {firstEmoji.icon}
                </Typography>
              ) : (
                <CardMedia
                  sx={{
                    margin: '0 auto',
                    width: '20px',
                    height: '20px',
                    borderRadius: '20px',
                    display: 'block',
                  }}
                  image={userInfo.avatar}
                />
              )}
            </Box>
          </Box>
          <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
            {firstEmoji ? firstEmoji.name : userInfo.contact_name}
          </Typography>
          <Typography
            sx={{
              color: '#FFFFFFCC',
              lineHeight: '1',
              textAlign: 'start',
              fontSize: '12px',
              fontWeight: '400',
            }}
          >
            {first && formatString(first)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mx: '8px' }}>
          <CardMedia sx={{ width: '24px', height: '24px' }} image={accountMove} />
        </Box>
        <Box
          sx={{
            padding: '16px 12px',
            height: '106px',
            flex: '1',
            backgroundColor: '#2C2C2C',
            borderRadius: '12px',
          }}
        >
          {selectedAccount && (
            <FWMoveDropdown
              contacts={childWallets}
              setSelectedChildAccount={setSelectedChildAccount}
            />
          )}
        </Box>
      </Box>
      {!payer && (
        <Box sx={{ padding: '8px 0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: '600' }}>Move Fee</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: '600' }}>0.0001 FLOW</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              sx={{ fontSize: '12px', fontWeight: '400', color: 'rgba(255, 255, 255, 0.60)' }}
            >
              It appears when moving between VM accounts
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AccountBox;
