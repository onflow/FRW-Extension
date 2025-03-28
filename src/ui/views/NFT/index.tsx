import { Button, Box } from '@mui/material';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useWallet } from 'ui/utils';

import EditNFTAddress from './EditNFTAddress';
import ListTab from './ListTab';

const NFTTab = () => {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [hasNFTs, setHasNFTs] = useState(false);

  const [address, setAddress] = useState<string | null>('');
  const [isEdit] = useState<boolean>(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState<boolean>(false);
  const [nftCount, setCount] = useState<number>(0);
  const [accessible, setAccessible] = useState<any>([]);
  const [activeCollection, setActiveCollection] = useState<any>([]);
  const [isActive, setIsActive] = useState(true);
  const gridRef = useRef<any>(null);
  const [childType, setChildType] = useState<string>('');
  const [childTypeLoaded, setChildTypeLoaded] = useState<boolean>(false);
  const loadNFTs = useCallback(async () => {
    const isChild = await wallet.getActiveWallet();
    const address = await wallet.getCurrentAddress();
    setAddress(address);
    // const flowCoins = fetchRemoteConfig.flowCoins();
    setChildTypeLoaded(true);
    if (isChild) {
      setChildType(isChild);

      const parentaddress = await wallet.getParentAddress();
      if (!parentaddress) {
        throw new Error('Parent address not found');
      }
      const activec = await wallet.getChildAccountAllowTypes(parentaddress, address!);
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
  }, [wallet]);

  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  return (
    <div id="scrollableTab">
      <ListTab
        setCount={setCount}
        data={{ ownerAddress: address }}
        ref={gridRef}
        accessible={accessible}
        isActive={isActive}
        activeCollection={activeCollection}
      />

      {childTypeLoaded && !childType && (
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

      <EditNFTAddress
        isAddAddressOpen={isAddAddressOpen}
        handleCloseIconClicked={() => setIsAddAddressOpen(false)}
        handleCancelBtnClicked={() => setIsAddAddressOpen(false)}
        handleAddBtnClicked={() => {
          wallet.clearNFT();
          setIsAddAddressOpen(false);
          gridRef!.current.reload();
        }}
        setAddress={setAddress}
        address={address!}
        isEdit={isEdit}
      />
    </div>
  );
};

export default NFTTab;
