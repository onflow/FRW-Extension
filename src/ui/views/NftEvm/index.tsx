import { Box, Button } from '@mui/material';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { ensureEvmAddressPrefix } from '@/shared/utils/address';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from 'ui/utils';

import ListTab from './ListTab';

const NftEvm = () => {
  const wallet = useWallet();
  const { mainAddress } = useProfiles();
  const [address, setAddress] = useState<string | null>(null);
  const [nftCount, setCount] = useState<number>(0);
  const [accessible] = useState<any>([]);
  const [isActive, setIsActive] = useState(true);
  const gridRef = useRef<any>(null);

  const loadNFTs = useCallback(async () => {
    const address = await wallet.queryEvmAddress(mainAddress!);
    setIsActive(false);
    setAddress(ensureEvmAddressPrefix(address));
  }, [wallet, mainAddress]);

  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  const refreshButtonClicked = () => {
    gridRef?.current?.reload();
  };

  return (
    <div id="scrollableTab">
      {address && (
        <ListTab
          setCount={setCount}
          data={{ ownerAddress: address }}
          ref={gridRef}
          accessible={accessible}
          isActive={isActive}
        />
      )}

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
    </div>
  );
};

export default NftEvm;
