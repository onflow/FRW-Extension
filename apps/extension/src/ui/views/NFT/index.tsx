import { Box, Button } from '@mui/material';
import React, { useCallback } from 'react';
import { Link } from 'react-router';

import { type CollectionNftList } from '@onflow/flow-wallet-shared/types/nft-types';

import { refreshNftCatalogCollections } from '@/data-model/cache-data-keys';
import { CollectionCard } from '@/ui/components/NFTs/collection-card';
import EmptyStatus from '@/ui/components/NFTs/EmptyStatus';
import ListSkeleton from '@/ui/components/NFTs/ListSkeleton';
import { useChildAccountAllowTypes } from '@/ui/hooks/use-account-hooks';
import { useNftCatalogCollections } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';

const extractContractAddress = (collection) => {
  return collection.split('.')[2];
};

const checkContractAddressInCollections = (
  collectionNftList: CollectionNftList,
  activeCollectionIds?: string[]
) => {
  const contractAddressWithout0x = collectionNftList.collection.contract_name;
  const isActiveCollect = activeCollectionIds?.some(
    (collection) => extractContractAddress(collection) === contractAddressWithout0x
  );
  return isActiveCollect ?? false;
};

const NFTTab = () => {
  const { currentWallet, parentWallet, activeAccountType, network } = useProfiles();

  // This will load the type of assets that the parent can access within the child account if a child account is active
  const activeCollections = useChildAccountAllowTypes(
    network,
    activeAccountType === 'child' ? parentWallet.address : undefined,
    activeAccountType === 'child' ? currentWallet.address : undefined
  );

  // Get the list of NFT Collections for the current wallet
  const nftCollectionsList = useNftCatalogCollections(network, currentWallet.address);
  const collectionLoading = nftCollectionsList === undefined;

  const isCollectionEmpty = nftCollectionsList?.length === 0;
  const ownerAddress = currentWallet.address;

  const handleEvmRefresh = useCallback(() => {
    refreshNftCatalogCollections(network, currentWallet.address);
  }, [network, currentWallet.address]);

  return (
    <div id="scrollableTab">
      <Box padding="0 8px">
        {collectionLoading ? (
          <ListSkeleton />
        ) : isCollectionEmpty ? (
          <EmptyStatus />
        ) : (
          nftCollectionsList.map((collectionNftList, index) => (
            <CollectionCard
              key={collectionNftList.collection.id}
              name={collectionNftList.collection.name}
              logo={collectionNftList.collection.logo}
              count={collectionNftList.count}
              index={index}
              contractName={collectionNftList.collection.contract_name}
              ownerAddress={ownerAddress}
              isAccessible={
                activeAccountType !== 'child' ||
                checkContractAddressInCollections(collectionNftList, activeCollections)
              }
            />
          ))
        )}
      </Box>
      {/* Add Collection button for Cadence accounts */}
      {activeAccountType === 'main' && (
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
      {/* Refresh button for evm */}
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
            onClick={handleEvmRefresh}
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
