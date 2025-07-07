import { Box, Button } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import { type ActiveAccountType } from '@/shared/types/wallet-types';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useProfiles } from '@/ui/hooks/useProfileHook';

import ListTab from './ListTab';

const NFTTab = () => {
  const wallet = useWallet();

  const [nftCount, setCount] = useState<number>(0);
  const [accessible, setAccessible] = useState<any>([]);
  const [activeCollection, setActiveCollection] = useState<any>([]);
  const [isActive, setIsActive] = useState(true);
  const listTabRef = useRef<{ reload: () => void }>(null);
  const [childType, setChildType] = useState<ActiveAccountType>('main');
  const [childTypeLoaded, setChildTypeLoaded] = useState<boolean>(false);

  const { currentWallet, parentWallet, activeAccountType } = useProfiles();

  const address = currentWallet.address;

  const refreshButtonClicked = () => {
    listTabRef.current?.reload();
  };
  useEffect(() => {
    const loadNFTs = async () => {
      const accountType = activeAccountType;
      setChildTypeLoaded(true);
      if (accountType === 'child' && address) {
        setChildType(accountType);

        const parentaddress = parentWallet.address;
        if (!parentaddress) {
          throw new Error('Parent address not found');
        }
        const childAddress = address;
        const activec = await wallet.getChildAccountAllowTypes(parentaddress, childAddress);
        setActiveCollection(activec);
        const nftResult = await wallet.checkAccessibleNft(parentaddress);
        if (nftResult) {
          setAccessible(nftResult);
        }
        setIsActive(false);
      } else {
        setIsActive(true);
      }
      // setAddress(address);
    };
    loadNFTs();
  }, [activeAccountType, address, wallet, parentWallet]);

  return (
    <div id="scrollableTab">
      <ListTab
        setCount={setCount}
        data={{ ownerAddress: address }}
        ref={listTabRef}
        accessible={accessible}
        isActive={isActive}
        activeCollection={activeCollection}
      />

      {childTypeLoaded && childType === 'main' && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: '8px',
            mb: 2,
          }}
        >
          <Button
            component={Link}
            to="/dashboard/nested/add_list"
            variant="outlined"
            sx={{
              borderRadius: '20px',
              border: '1px solid #FFFFFF',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              padding: '6px 26px',
              minWidth: '132px',
              textTransform: 'capitalize',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid #FFFFFF',
              },
            }}
          >
            {chrome.i18n.getMessage('Add')}
          </Button>
        </Box>
      )}
      {activeAccountType === 'evm' && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: '8px',
            mb: 2,
          }}
        >
          <Button
            onClick={refreshButtonClicked}
            variant="outlined"
            sx={{
              borderRadius: '20px',
              border: '1px solid #FFFFFF',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              padding: '6px 26px',
              minWidth: '132px',
              textTransform: 'capitalize',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid #FFFFFF',
              },
            }}
          >
            {chrome.i18n.getMessage('Refresh')}
          </Button>
        </Box>
      )}
    </div>
  );
};

export default NFTTab;
