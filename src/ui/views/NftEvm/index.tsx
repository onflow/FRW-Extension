import { Box, Button } from '@mui/material';
import React, { useRef, useState } from 'react';

import { useWallet } from '@/ui/hooks/use-wallet';
import { useProfiles } from '@/ui/hooks/useProfileHook';

import ListTab from './ListTab';

const NftEvm = () => {
  const wallet = useWallet();
  const { mainAddress } = useProfiles();
  const [nftCount, setCount] = useState<number>(0);
  const [accessible] = useState<any>([]);
  const [isActive, setIsActive] = useState(true);
  const listTabRef = useRef<{ reload: () => void }>(null);

  const { evmAddress } = useProfiles();

  // TODO: Think it could just be current address
  const address = evmAddress;

  const refreshButtonClicked = () => {
    listTabRef.current?.reload();
  };

  return (
    <div id="scrollableTab">
      {address && (
        <ListTab
          setCount={setCount}
          data={{ ownerAddress: address }}
          ref={listTabRef}
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
